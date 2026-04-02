import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') throw ApiError.forbidden();

        const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Student profile');

        const url = new URL(request.url);
        const dayParam = url.searchParams.get('day');
        const dayOfWeek = dayParam !== null ? parseInt(dayParam) : new Date().getDay();

        const raw = await db.timetable.findMany({
            where: { classId: profile.classId ?? undefined, dayOfWeek },
            include: {
                subject: { select: { name: true } },
                teacher: { include: { user: { select: { name: true } } } },
                section: { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
        });

        const timetable = raw.map(t => ({
            id: t.id,
            subject: t.subject.name,
            teacher: t.teacher?.user?.name ?? 'TBD',
            startTime: t.startTime,
            endTime: t.endTime,
            roomNumber: t.roomNumber,
            section: t.section?.name ?? null,
        }));

        return NextResponse.json(successResponse(timetable));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
