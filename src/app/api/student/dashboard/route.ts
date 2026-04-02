import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') throw ApiError.forbidden();

        const profile = await db.studentProfile.findUnique({
            where: { userId: session.userId },
            include: {
                user: { select: { name: true, email: true } },
                class: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
            },
        });
        if (!profile) throw ApiError.notFound('Student profile');

        // Attendance stats for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const totalEntries = await db.attendanceEntry.count({ where: { studentId: profile.id } });
        const presentEntries = await db.attendanceEntry.count({ where: { studentId: profile.id, status: 'PRESENT' } });
        const attendancePercent = totalEntries > 0 ? Math.round((presentEntries / totalEntries) * 100) : 0;

        // Upcoming assignments due
        const homework = await db.homework.findMany({
            where: { classId: profile.classId ?? undefined, dueDate: { gte: now } },
            include: { subject: true, submissions: { where: { studentId: profile.id } } },
            orderBy: { dueDate: 'asc' },
            take: 5,
        });

        // Latest marks
        const marks = await db.mark.findMany({
            where: { studentId: profile.id },
            include: { exam: { include: { subject: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Today's timetable
        const dayOfWeek = now.getDay();
        const timetable = await db.timetable.findMany({
            where: { classId: profile.classId ?? undefined, dayOfWeek },
            include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
            orderBy: { startTime: 'asc' },
        });

        // Announcements
        const announcements = await db.announcement.findMany({
            where: { OR: [{ schoolId: profile.user?.email ? undefined : undefined }, { targetType: 'ALL' }] },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        return NextResponse.json(successResponse({
            profile: {
                name: session.name,
                studentId: profile.studentId,
                class: profile.class?.name,
                section: profile.section?.name,
                avatarUrl: profile.avatarUrl,
            },
            attendance: { percent: attendancePercent, present: presentEntries, total: totalEntries },
            homework: homework.map(h => ({
                id: h.id,
                title: h.title,
                subject: h.subject.name,
                dueDate: h.dueDate,
                status: h.submissions[0]?.status ?? 'PENDING',
            })),
            marks,
            timetable: timetable.map(t => ({
                id: t.id,
                subject: t.subject.name,
                teacher: t.teacher.user.name,
                startTime: t.startTime,
                endTime: t.endTime,
                roomNumber: t.roomNumber,
            })),
            announcements: announcements.map(a => ({ id: a.id, title: a.title, body: a.body, createdAt: a.createdAt })),
        }));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[student/dashboard] GET error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
