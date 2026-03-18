import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';

const AttendanceSubmitSchema = z.object({
    timetableId: z.string(),
    date: z.string(),
    entries: z.array(z.object({
        studentId: z.string(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_DUTY', 'MEDICAL_LEAVE']),
        remarks: z.string().optional(),
    })),
});

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();

        const url = new URL(request.url);
        const classId = url.searchParams.get('classId');
        if (!classId) throw ApiError.badRequest('classId is required');

        const students = await db.studentProfile.findMany({
            where: { classId, isActive: true },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { rollNumber: 'asc' },
        });
        return NextResponse.json(successResponse(students));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'TEACHER') throw ApiError.forbidden();

        const body = validate(AttendanceSubmitSchema, await request.json());
        const date = new Date(body.date);
        date.setHours(0, 0, 0, 0);

        // Upsert the attendance record for this period+date
        const record = await db.attendanceRecord.upsert({
            where: { timetableId_date: { timetableId: body.timetableId, date } },
            update: { isLocked: false },
            create: { timetableId: body.timetableId, date, submittedAt: new Date() },
        });

        // Upsert each entry
        await db.$transaction(
            body.entries.map(entry =>
                db.attendanceEntry.upsert({
                    where: { recordId_studentId: { recordId: record.id, studentId: entry.studentId } },
                    update: { status: entry.status, remarks: entry.remarks },
                    create: { recordId: record.id, studentId: entry.studentId, status: entry.status, remarks: entry.remarks },
                })
            )
        );

        // Lock the record after submission
        await db.attendanceRecord.update({ where: { id: record.id }, data: { isLocked: true, submittedAt: new Date() } });

        return NextResponse.json(successResponse({ recordId: record.id, total: body.entries.length }));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[teacher/attendance] POST error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
