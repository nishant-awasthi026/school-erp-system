import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') throw ApiError.forbidden();

        const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Student profile');

        // All homework for this student's class
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        // Get tomorrow's timetable subjects for priority sorting
        const tomorrowDay = (now.getDay() + 1) % 7;
        const tomorrowTimetable = await db.timetable.findMany({
            where: { classId: profile.classId ?? undefined, dayOfWeek: tomorrowDay },
            include: { subject: { select: { name: true } } },
            orderBy: { startTime: 'asc' },
        });
        const tomorrowSubjects = tomorrowTimetable.map(t => t.subject.name);

        const allHomework = await db.homework.findMany({
            where: { classId: profile.classId ?? undefined },
            include: {
                subject: { select: { name: true } },
                teacher: { include: { user: { select: { name: true } } } },
                submissions: { where: { studentId: profile.id } },
            },
            orderBy: { dueDate: 'asc' },
        });

        const homework = allHomework.map(h => {
            const submission = h.submissions[0];
            const isTomorrowSubject = tomorrowSubjects.includes(h.subject.name);
            const isOverdue = new Date(h.dueDate) < now && submission?.status !== 'SUBMITTED';
            return {
                id: h.id,
                title: h.title,
                description: h.description,
                subject: h.subject.name,
                teacher: h.teacher?.user?.name ?? 'TBD',
                dueDate: h.dueDate,
                status: submission?.status ?? 'PENDING',
                submittedAt: submission?.submittedAt ?? null,
                grade: submission?.grade ?? null,
                remarks: submission?.remarks ?? null,
                isTomorrowSubject,
                isOverdue,
                submissionId: submission?.id ?? null,
            };
        });

        // Sort: tomorrow subjects first, then by due date
        homework.sort((a, b) => {
            if (a.isTomorrowSubject && !b.isTomorrowSubject) return -1;
            if (!a.isTomorrowSubject && b.isTomorrowSubject) return 1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        return NextResponse.json(successResponse({ homework, tomorrowSubjects }));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

// Submit homework
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') throw ApiError.forbidden();

        const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Student profile');

        const { homeworkId, textContent } = await request.json();

        const submission = await db.homeworkSubmission.upsert({
            where: { homeworkId_studentId: { homeworkId, studentId: profile.id } },
            create: {
                homeworkId,
                studentId: profile.id,
                status: 'SUBMITTED',
                submittedAt: new Date(),
                textContent: textContent ?? '',
            },
            update: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
                textContent: textContent ?? '',
            },
        });

        return NextResponse.json(successResponse(submission));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
