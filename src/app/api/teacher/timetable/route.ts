import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();

        const profile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Teacher profile');

        const today = new Date().getDay();
        const url = new URL(request.url);
        const all = url.searchParams.get('all') === '1';

        const timetable = await db.timetable.findMany({
            where: { teacherId: profile.id, ...(all ? {} : { dayOfWeek: today }) },
            include: { class: true, section: true, subject: true },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
        return NextResponse.json(successResponse(timetable));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
