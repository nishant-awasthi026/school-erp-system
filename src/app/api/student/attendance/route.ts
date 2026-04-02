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
        const view = url.searchParams.get('view') ?? 'summary'; // summary | monthly | subject | period

        // All attendance entries for this student
        const entries = await db.attendanceEntry.findMany({
            where: { studentId: profile.id },
            include: {
                record: {
                    include: {
                        timetable: {
                            include: { subject: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        if (view === 'monthly') {
            // Group by month
            const monthMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
            for (const e of entries) {
                const d = new Date(e.record.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap[key]) monthMap[key] = { present: 0, absent: 0, late: 0, total: 0 };
                monthMap[key].total++;
                if (e.status === 'PRESENT') monthMap[key].present++;
                else if (e.status === 'ABSENT') monthMap[key].absent++;
                else if (e.status === 'LATE') monthMap[key].late++;
            }
            const monthly = Object.entries(monthMap)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, stats]) => ({
                    month,
                    label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    ...stats,
                    percent: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
                }));
            return NextResponse.json(successResponse({ view: 'monthly', data: monthly }));
        }

        if (view === 'subject') {
            // Group by subject
            const subjMap: Record<string, { name: string; present: number; absent: number; total: number }> = {};
            for (const e of entries) {
                const subj = e.record.timetable.subject.name;
                if (!subjMap[subj]) subjMap[subj] = { name: subj, present: 0, absent: 0, total: 0 };
                subjMap[subj].total++;
                if (e.status === 'PRESENT') subjMap[subj].present++;
                else if (e.status === 'ABSENT') subjMap[subj].absent++;
            }
            const subjects = Object.values(subjMap).map(s => ({
                ...s,
                percent: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
            })).sort((a, b) => b.total - a.total);
            return NextResponse.json(successResponse({ view: 'subject', data: subjects }));
        }

        if (view === 'period') {
            // Return last 30 attendance entries with date + subject + status
            const period = entries.slice(0, 40).map(e => ({
                id: e.id,
                date: e.record.date,
                subject: e.record.timetable.subject.name,
                startTime: e.record.timetable.startTime,
                status: e.status,
                remarks: e.remarks,
            }));
            return NextResponse.json(successResponse({ view: 'period', data: period }));
        }

        // Summary
        const total = entries.length;
        const present = entries.filter(e => e.status === 'PRESENT').length;
        const absent = entries.filter(e => e.status === 'ABSENT').length;
        const late = entries.filter(e => e.status === 'LATE').length;
        return NextResponse.json(successResponse({
            view: 'summary',
            data: { total, present, absent, late, percent: total > 0 ? Math.round((present / total) * 100) : 0 }
        }));

    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
