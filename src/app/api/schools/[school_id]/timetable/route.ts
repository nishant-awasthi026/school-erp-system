import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';
import { validate } from '@/lib/utils/validate';
import { z } from 'zod';

const TimetableSchema = z.object({
    classId: z.string().min(1),
    subjectId: z.string().min(1),
    teacherId: z.string().min(1),
    dayOfWeek: z.string().or(z.number()).transform(v => Number(v)),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    roomNumber: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
            throw ApiError.forbidden('Only school admins can manage timetables');
        }
        
        const { school_id } = await params;
        const body = validate(TimetableSchema, await request.json());

        // Check for conflicts (same teacher, same day, same time)
        const conflict = await db.timetable.findFirst({
            where: {
                schoolId: school_id,
                teacherId: body.teacherId,
                dayOfWeek: body.dayOfWeek,
                startTime: body.startTime,
            }
        });

        if (conflict) {
            throw ApiError.conflict('Teacher is already assigned to a class at this time');
        }

        const newEntry = await db.timetable.create({
            data: {
                schoolId: school_id,
                classId: body.classId,
                subjectId: body.subjectId,
                teacherId: body.teacherId,
                dayOfWeek: body.dayOfWeek,
                startTime: body.startTime,
                endTime: body.endTime,
                roomNumber: body.roomNumber,
            },
            include: {
                class: true,
                subject: true,
                teacher: { include: { user: true } },
            }
        });

        return NextResponse.json(successResponse(newEntry), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[timetable] POST error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
