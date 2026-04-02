import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';
import { validate } from '@/lib/utils/validate';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/observability/audit';
import { encrypt } from '@/lib/utils/crypto';
import { recordHttpRequest, recordError } from '@/lib/observability/metrics-recorder';
import { Singleflight } from '@/lib/infra/distributed-utils';
import { getCached, setCached, BloomFilter, isRedisConfigured } from '@/lib/infra/redis';

const AddStudentSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    rollNumber: z.string().optional(),
    studentId: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    category: z.string().optional(),
    bloodGroup: z.string().optional(),
    aadhaar: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    guardianPhone: z.string().optional(),
    address: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    const startTime = Date.now();
    const { school_id } = await params;
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const cacheKey = `students:${school_id}:${classId || 'all'}`;

    try {
        const session = await getSession();
        if (!session || !['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(session.role)) throw ApiError.forbidden();

        // 1. Check Distributed Cache (Redis) — skipped when Redis not configured
        if (isRedisConfigured) {
            const cached = await getCached<any[]>(cacheKey);
            if (cached) {
                console.log(`[Cache] Hit for ${cacheKey}`);
                return NextResponse.json(successResponse(cached));
            }
        }

        // 2. Singleflight: Deduplicate concurrent identical DB requests
        const students = await Singleflight.execute(cacheKey, async () => {
            // 3. Sharded Read: Use Replica for this specific school
            return await getDb(school_id, { readOnly: true }).user.findMany({
                where: { schoolId: school_id, role: 'STUDENT', ...(classId ? { studentProfile: { classId } } : {}) },
                include: { studentProfile: { include: { class: true, section: true } } },
                orderBy: { createdAt: 'desc' },
            });
        });

        // 4. Update Cache — skipped when Redis not configured
        if (isRedisConfigured) {
            await setCached(cacheKey, students, 300); // 5 min TTL
        }

        const duration = (Date.now() - startTime) / 1000;
        recordHttpRequest('GET', `/api/schools/[school_id]/students`, 200, duration);

        return NextResponse.json(successResponse(students));
    } catch (err) {
        const duration = (Date.now() - startTime) / 1000;
        const status = err instanceof ApiError ? err.status : 500;
        recordHttpRequest('GET', `/api/schools/[school_id]/students`, status, duration);
        recordError('STUDENT_FETCH_ERROR', err instanceof Error ? err.message : String(err));

        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    try {
        const session = await getSession();
        if (!session || session.role !== 'SCHOOL_ADMIN') throw ApiError.forbidden();

        const body = validate(AddStudentSchema, await request.json());

        // Distributed Pattern: Bloom Filter check to quickly discard existing emails
        // Falls back to direct DB check when Redis not configured
        if (isRedisConfigured) {
            const emailMightExist = await BloomFilter.exists('emails', body.email.toLowerCase());
            if (emailMightExist) {
                // Bloom Filter might have false positives, so we always do a final DB check
                const existing = await getDb(school_id).user.findUnique({ where: { email: body.email.toLowerCase() } });
                if (existing) throw ApiError.conflict('Email already in use');
            }
        } else {
            // Direct DB check when no Redis
            const existing = await getDb(school_id).user.findUnique({ where: { email: body.email.toLowerCase() } });
            if (existing) throw ApiError.conflict('Email already in use');
        }


        const hashedPwd = await bcrypt.hash(body.password, 10);

        // Write to Primary Shard
        const user = await getDb(school_id).user.create({
            data: {
                name: body.name, email: body.email.toLowerCase(),
                password: hashedPwd, role: 'STUDENT', schoolId: school_id,
                studentProfile: {
                    create: {
                        classId: body.classId, sectionId: body.sectionId,
                        rollNumber: body.rollNumber, studentId: body.studentId,
                        dob: body.dob ? new Date(body.dob) : undefined,
                        gender: body.gender, category: body.category,
                        bloodGroup: body.bloodGroup, aadhaar: body.aadhaar ? encrypt(body.aadhaar) : undefined,
                        fatherName: body.fatherName, motherName: body.motherName,
                        guardianPhone: body.guardianPhone, parentPhone: body.guardianPhone,
                        parentName: body.fatherName, address: body.address,
                    }
                }
            },
            include: { studentProfile: true },
        });

        // Update Bloom Filter for future lookups (no-op when Redis not configured)
        await BloomFilter.add('emails', body.email.toLowerCase());

        // Invalidate cache for this school (no-op when Redis not configured)
        if (isRedisConfigured) {
            await setCached(`students:${school_id}:all`, null, 0);
        }


        logAudit({ actorId: session.userId, actorRole: session.role, tenantId: school_id, action: 'CREATE', entity: 'Student', entityId: user.id, after: { name: body.name, email: body.email } });

        return NextResponse.json(successResponse(user), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[students] POST error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
