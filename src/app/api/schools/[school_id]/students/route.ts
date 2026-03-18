import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

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
    try {
        const session = await getSession();
        if (!session || !['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(session.role)) throw ApiError.forbidden();
        const { school_id } = await params;

        const url = new URL(request.url);
        const classId = url.searchParams.get('classId');

        const students = await db.user.findMany({
            where: { schoolId: school_id, role: 'STUDENT', ...(classId ? { studentProfile: { classId } } : {}) },
            include: { studentProfile: { include: { class: true, section: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(successResponse(students));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SCHOOL_ADMIN') throw ApiError.forbidden();
        const { school_id } = await params;

        const body = validate(AddStudentSchema, await request.json());
        const existing = await db.user.findUnique({ where: { email: body.email } });
        if (existing) throw ApiError.conflict('Email already in use');

        const hashedPwd = await bcrypt.hash(body.password, 10);

        const user = await db.user.create({
            data: {
                name: body.name, email: body.email.toLowerCase(),
                password: hashedPwd, role: 'STUDENT', schoolId: school_id,
                studentProfile: {
                    create: {
                        classId: body.classId, sectionId: body.sectionId,
                        rollNumber: body.rollNumber, studentId: body.studentId,
                        dob: body.dob ? new Date(body.dob) : undefined,
                        gender: body.gender, category: body.category,
                        bloodGroup: body.bloodGroup, aadhaar: body.aadhaar,
                        fatherName: body.fatherName, motherName: body.motherName,
                        guardianPhone: body.guardianPhone, parentPhone: body.guardianPhone,
                        parentName: body.fatherName, address: body.address,
                    }
                }
            },
            include: { studentProfile: true },
        });

        logAudit({ actorId: session.userId, actorRole: session.role, tenantId: school_id, action: 'CREATE', entity: 'Student', entityId: user.id, after: { name: body.name, email: body.email } });

        return NextResponse.json(successResponse(user), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[students] POST error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
