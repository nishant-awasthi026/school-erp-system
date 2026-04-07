import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();

        const profile = await db.teacherProfile.findUnique({
            where: { userId: session.userId },
            include: { user: { select: { name: true, email: true, school: { select: { logoUrl: true, name: true } } } } },
        });
        if (!profile) throw ApiError.notFound('Teacher profile');

        // Today's timetable
        const today = new Date().getDay();
        const todayClasses = await db.timetable.findMany({
            where: { teacherId: profile.id, dayOfWeek: today },
            include: { class: true, subject: true, section: true },
            orderBy: { startTime: 'asc' },
        });

        // Pending homework count
        const pendingGrading = await db.homeworkSubmission.count({
            where: { homework: { teacherId: profile.id }, status: 'SUBMITTED' },
        });

        // Recent homework
        const recentHomework = await db.homework.findMany({
            where: { teacherId: profile.id },
            include: {
                class: true, subject: true,
                _count: { select: { submissions: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Announcements
        const announcements = await db.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Upcoming exam mark entry
        const upcomingExams = await db.exam.findMany({
            where: { date: { gte: new Date() } },
            include: { class: true, subject: true },
            orderBy: { date: 'asc' },
            take: 3,
        });

        // Quick attendance stats for the first class today
        let attendanceQuick = null;
        if (todayClasses.length > 0) {
            const firstClass = todayClasses[0];
            const totalStudents = await db.studentProfile.count({ where: { classId: firstClass.classId, isActive: true } });
            const today0 = new Date(); today0.setHours(0, 0, 0, 0);
            const record = await db.attendanceRecord.findFirst({
                where: { timetableId: firstClass.id, date: { gte: today0 } },
                include: { _count: { select: { entries: true } } },
            });
            const presentCount = record ? await db.attendanceEntry.count({ where: { recordId: record.id, status: 'PRESENT' } }) : 0;
            attendanceQuick = {
                className: `${firstClass.class.name}${firstClass.section ? `-${firstClass.section.name}` : ''}`,
                subject: firstClass.subject.name,
                timetableId: firstClass.id,
                totalStudents,
                presentCount,
                isSubmitted: record?.isLocked ?? false,
            };
        }

        return NextResponse.json(successResponse({
            teacher: { name: session.name, department: profile.department, designation: profile.designation },
            school: {
                logoUrl: profile.user?.school?.logoUrl ?? null,
                name: profile.user?.school?.name ?? 'The Fluid Scholar'
            },
            todayClasses,
            pendingGrading,
            recentHomework,
            announcements,
            upcomingExams,
            attendanceQuick,
        }));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[teacher/dashboard] GET error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
