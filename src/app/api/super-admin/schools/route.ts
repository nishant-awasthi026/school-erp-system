import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';

const CreateSchoolSchema = z.object({
    name: z.string().min(2, 'School name required'),
    address: z.string().optional(),
    phone: z.string().optional(),
    board: z.string().optional(),
    principalName: z.string().optional(),
    udiseCode: z.string().optional(),
    academicYearStart: z.string().optional(),
    academicYearEnd: z.string().optional(),
    adminName: z.string().min(2, 'Admin name required'),
    adminEmail: z.string().email('Valid admin email required'),
});

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') throw ApiError.forbidden();

        const schools = await db.school.findMany({
            include: { _count: { select: { users: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(successResponse(schools));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') throw ApiError.forbidden();

        const body = validate(CreateSchoolSchema, await request.json());

        // Check for duplicate email
        const existingUser = await db.user.findUnique({ where: { email: body.adminEmail } });
        if (existingUser) throw ApiError.conflict(`Email ${body.adminEmail} is already in use`);

        // Generate temp password
        const tempPassword = `School@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create school
        const school = await db.school.create({
            data: {
                name: body.name,
                address: body.address,
                phone: body.phone,
                board: body.board,
                principalName: body.principalName,
                udiseCode: body.udiseCode || undefined,
                academicYearStart: body.academicYearStart ? new Date(body.academicYearStart) : undefined,
                academicYearEnd: body.academicYearEnd ? new Date(body.academicYearEnd) : undefined,
            },
        });

        // Create admin user for school
        const adminUser = await db.user.create({
            data: {
                name: body.adminName,
                email: body.adminEmail,
                password: hashedPassword,
                role: 'SCHOOL_ADMIN',
                schoolId: school.id,
            },
        });

        logAudit({
            actorId: session.userId,
            actorRole: session.role,
            action: 'CREATE',
            entity: 'School',
            entityId: school.id,
            after: { name: school.name, adminEmail: adminUser.email },
        });

        return NextResponse.json(successResponse({
            school,
            adminCredentials: { email: adminUser.email, password: tempPassword },
        }), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[super-admin/schools] POST error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
