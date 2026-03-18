import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';

const HomeworkSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    classId: z.string(),
    sectionId: z.string().optional(),
    subjectId: z.string(),
    dueDate: z.string(),
    attachments: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();

        const profile = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
        if (!profile) throw ApiError.notFound('Teacher profile');

        const homework = await db.homework.findMany({
            where: { teacherId: profile.id },
            include: { class: true, subject: true, section: true, _count: { select: { submissions: true } } },
            orderBy: { dueDate: 'desc' },
        });
        return NextResponse.json(successResponse(homework));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();

        const profile = await db.teacherProfile.findUnique({
            where: { userId: session.userId },
            include: { user: { select: { schoolId: true } } },
        });
        if (!profile) throw ApiError.notFound('Teacher profile');

        const body = validate(HomeworkSchema, await request.json());

        const homework = await db.homework.create({
            data: {
                title: body.title,
                description: body.description,
                classId: body.classId,
                sectionId: body.sectionId,
                subjectId: body.subjectId,
                dueDate: new Date(body.dueDate),
                teacherId: profile.id,
                schoolId: profile.user.schoolId!,
                attachments: body.attachments ? JSON.stringify(body.attachments) : undefined,
            },
        });
        return NextResponse.json(successResponse(homework), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
