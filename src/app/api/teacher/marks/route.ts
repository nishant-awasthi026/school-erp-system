import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/teacher/marks?examId=...
// Returns students in the exam's class with their existing marks
export async function GET(req: NextRequest) {
    try {
        const examId = req.nextUrl.searchParams.get('examId');
        if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 });

        const exam = await db.exam.findUnique({
            where: { id: examId },
            include: { marks: { select: { studentId: true, marksObtained: true, grade: true, remarks: true } } },
        });
        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

        const students = await db.studentProfile.findMany({
            where: { classId: exam.classId, isActive: true },
            include: { user: { select: { name: true } } },
            orderBy: [{ rollNumber: 'asc' }],
        });

        const markMap: Record<string, { marksObtained: number; grade: string | null; remarks: string | null }> = {};
        for (const m of exam.marks) {
            markMap[m.studentId] = { marksObtained: m.marksObtained, grade: m.grade, remarks: m.remarks };
        }

        const result = students.map((s: any) => ({
            id: s.id,
            rollNumber: s.rollNumber,
            user: { name: s.user.name },
            existingMark: markMap[s.id] || null,
        }));

        return NextResponse.json({ students: result });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/teacher/marks
// Upserts marks for all students in bulk
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { examId, entries, enteredBy } = body;

        if (!examId || !entries || !enteredBy) {
            return NextResponse.json({ error: 'examId, entries, and enteredBy are required' }, { status: 400 });
        }

        const exam = await db.exam.findUnique({ where: { id: examId } });
        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

        let count = 0;
        for (const entry of entries) {
            const { studentId, marksObtained, grade, remarks } = entry;
            if (marksObtained > exam.maxMarks) continue; // skip invalid

            await db.mark.upsert({
                where: { examId_studentId: { examId, studentId } },
                create: { examId, studentId, marksObtained, grade, remarks, enteredBy },
                update: { marksObtained, grade, remarks },
            });
            count++;
        }

        return NextResponse.json({ success: true, count });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
