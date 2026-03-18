import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

async function getAttendance(userId: string) {
    const profile = await db.studentProfile.findUnique({ where: { userId } });
    if (!profile) return { profile: null, entries: [], summary: { PRESENT: 0, ABSENT: 0, LATE: 0 } };

    const entries = await db.attendanceEntry.findMany({
        where: { studentId: profile.id },
        include: { record: { include: { timetable: { include: { subject: true, class: true } } } } },
        orderBy: { record: { date: 'desc' } },
    });

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0 };
    entries.forEach((e: any) => {
        if (e.status in summary) summary[e.status as keyof typeof summary]++;
    });

    return { profile, entries, summary };
}

export default async function StudentAttendancePage() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { entries, summary } = await getAttendance(user.userId);

    const total = summary.PRESENT + summary.ABSENT + summary.LATE;
    const pct = total > 0 ? Math.round((summary.PRESENT / total) * 100) : 100;

    const statusColor: Record<string, string> = { PRESENT: 'badge-green', ABSENT: 'badge-red', LATE: 'badge-yellow' };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">✅ My Attendance</h1>
                <div className={`badge ${pct >= 75 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.9375rem', padding: '0.375rem 0.875rem' }}>
                    {pct}% Overall
                </div>
            </div>

            {/* Summary */}
            <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Present', value: summary.PRESENT, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
                    { label: 'Absent', value: summary.ABSENT, icon: '❌', color: 'var(--error)', bg: 'var(--error-light)' },
                    { label: 'Late', value: summary.LATE, icon: '⏰', color: 'var(--warning)', bg: 'var(--warning-light)' },
                ].map(c => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                        <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                        <div className="stat-card-label">{c.label} days</div>
                    </div>
                ))}
            </div>

            {pct < 75 && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    ⚠️ Your attendance is {pct}%. You need at least 75% attendance. You are short by {Math.ceil((total * 0.75 - summary.PRESENT))} more days of presence.
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr><th>Date</th><th>Subject</th><th>Class</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No attendance records yet</td></tr>
                        ) : entries.map((e: any) => (
                            <tr key={e.id}>
                                <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                <td>{e.record.timetable?.subject?.name || '—'}</td>
                                <td>Class {e.record.timetable?.class?.name || '—'}</td>
                                <td><span className={`badge ${statusColor[e.status] || 'badge-gray'}`}>{e.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
