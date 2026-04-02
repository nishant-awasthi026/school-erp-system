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

        // Get marks with remarks from teachers
        const marks = await db.mark.findMany({
            where: { studentId: profile.id },
            include: {
                exam: { include: { subject: { select: { name: true } } } },
                teacher: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get homework submissions with teacher remarks
        const hwSubmissions = await db.homeworkSubmission.findMany({
            where: { studentId: profile.id, OR: [{ remarks: { not: null } }, { grade: { not: null } }] },
            include: {
                homework: { include: { subject: { select: { name: true } }, teacher: { include: { user: { select: { name: true } } } } } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        const examRemarks = marks.map(m => ({
            id: m.id,
            type: 'exam' as const,
            subject: m.exam.subject.name,
            exam: m.exam.name,
            examType: m.exam.type,
            marksObtained: m.marksObtained,
            maxMarks: m.exam.maxMarks,
            grade: m.grade,
            remarks: m.remarks ?? null,
            teacher: m.teacher.user.name,
            date: m.createdAt,
        }));

        const homeworkRemarks = hwSubmissions.map(s => ({
            id: s.id,
            type: 'homework' as const,
            subject: s.homework.subject.name,
            homework: s.homework.title,
            grade: s.grade,
            marksObtained: s.marksObtained ?? null,
            maxMarks: null,
            remarks: s.remarks ?? null,
            teacher: s.homework.teacher?.user?.name ?? 'Teacher',
            date: s.updatedAt,
        }));

        const all = [...examRemarks, ...homeworkRemarks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(successResponse(all));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
