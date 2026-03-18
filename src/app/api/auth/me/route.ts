import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { ApiError } from '@/lib/errors';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            throw ApiError.unauthorized('Not authenticated');
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true, email: true, name: true, role: true, schoolId: true,
                school: { select: { name: true, logoUrl: true } },
                studentProfile: { select: { id: true, studentId: true, classId: true } },
                teacherProfile: { select: { id: true, employeeId: true, department: true } },
            },
        });

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        return NextResponse.json({ success: true, data: user });
    } catch (err) {
        if (err instanceof ApiError) {
            return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        }
        return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Server error' } }, { status: 500 });
    }
}
