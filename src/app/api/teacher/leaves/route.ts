import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';
import { validate } from '@/lib/utils/validate';
import { z } from 'zod';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();
        const profile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Teacher profile');
        const leaves = await db.leaveRequest.findMany({ where: { teacherId: profile.id }, orderBy: { createdAt: 'desc' } });
        return NextResponse.json(successResponse(leaves));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

const LeaveSchema = z.object({
    leaveType: z.enum(['CASUAL', 'EARNED', 'MEDICAL', 'SPECIAL']),
    fromDate: z.string(),
    toDate: z.string(),
    reason: z.string().min(10, 'Please provide a valid reason (min 10 characters)'),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();
        const profile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Teacher profile');
        const body = validate(LeaveSchema, await request.json());
        const leave = await db.leaveRequest.create({
            data: { teacherId: profile.id, ...body, fromDate: new Date(body.fromDate), toDate: new Date(body.toDate) }
        });
        return NextResponse.json(successResponse(leave), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
