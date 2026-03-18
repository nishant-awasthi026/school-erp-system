import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

async function getStudentData(userId: string) {
    const profile = await db.studentProfile.findUnique({
        where: { userId },
        include: {
            class: true, section: true,
            user: { include: { school: { select: { name: true } } } },
        },
    });
    if (!profile) return { profile: null, feesPending: 0, homeworkDue: 0, attendancePct: 0, notices: [] };

    const [feesPending, homeworkDue, presentCount, absentCount, lateCount, notices, recentMarks] = await Promise.all([
        db.monthlyFee.count({ where: { studentId: profile.id, status: { in: ['PENDING', 'PARTIAL'] } } }),
        db.homeworkSubmission.count({ where: { studentId: profile.id, status: 'PENDING' } }),
        db.attendanceEntry.count({ where: { studentId: profile.id, status: 'PRESENT' } }),
        db.attendanceEntry.count({ where: { studentId: profile.id, status: 'ABSENT' } }),
        db.attendanceEntry.count({ where: { studentId: profile.id, status: 'LATE' } }),
        db.notice.findMany({ where: { schoolId: profile.user.schoolId! }, orderBy: { createdAt: 'desc' }, take: 4 }),
        db.mark.findMany({ where: { studentId: profile.id }, include: { exam: { include: { subject: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const total = presentCount + absentCount + lateCount;
    const attendancePct = total > 0 ? Math.round((presentCount / total) * 100) : 100;

    return { profile, feesPending, homeworkDue, attendancePct, notices, recentMarks };
}

export default async function StudentDashboard() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { profile, feesPending, homeworkDue, attendancePct, notices, recentMarks } = await getStudentData(user.userId);

    if (!profile) return (
        <div className="card"><div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Profile not set up</div>
            <div className="empty-state-desc">Contact your school admin to set up your student profile.</div>
        </div></div>
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hello, {user.name.split(' ')[0]}! 👋</h1>
                    <p className="page-subtitle">
                        {profile.user.school?.name} · Class {profile.class?.name}{profile.section ? `-${profile.section.name}` : ''} · Roll #{profile.rollNumber || '—'}
                    </p>
                </div>
                <Link href="/dashboard/student/fees" className="btn btn-primary">💳 Pay Fees</Link>
            </div>

            {/* Stats */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Attendance', value: `${attendancePct}%`, icon: '✅', color: attendancePct >= 75 ? 'var(--success)' : 'var(--error)', bg: attendancePct >= 75 ? 'var(--success-light)' : 'var(--error-light)', href: 'attendance' },
                    { label: 'Pending Homework', value: homeworkDue, icon: '📝', color: homeworkDue > 0 ? 'var(--warning)' : 'var(--success)', bg: homeworkDue > 0 ? 'var(--warning-light)' : 'var(--success-light)', href: 'homework' },
                    { label: 'Fee Due', value: feesPending, icon: '💰', color: feesPending > 0 ? 'var(--error)' : 'var(--success)', bg: feesPending > 0 ? 'var(--error-light)' : 'var(--success-light)', href: 'fees' },
                    { label: 'Student ID', value: (profile as any).studentId || '—', icon: '🎓', color: 'var(--primary)', bg: 'var(--primary-light)', href: 'profile' },
                ].map(c => (
                    <Link key={c.label} href={`/dashboard/student/${c.href}`} style={{ textDecoration: 'none' }}>
                        <div className="stat-card card-hover">
                            <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                            <div className="stat-card-value" style={{ color: c.color, fontSize: c.label === 'Student ID' ? '1.125rem' : '2rem' }}>{c.value}</div>
                            <div className="stat-card-label">{c.label}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Attendance Warning */}
            {attendancePct < 75 && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    ⚠️ Your attendance is {attendancePct}% — below the minimum 75% requirement. Please attend classes regularly.
                </div>
            )}

            <div className="grid-cols-2">
                {/* Recent Marks */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>🏆 Recent Results</h2>
                        <Link href="/dashboard/student/results" className="btn btn-ghost btn-sm">All Results</Link>
                    </div>
                    {recentMarks.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No results yet</div></div>
                    ) : recentMarks.map((m: any) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.exam.subject.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.exam.name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: m.marksObtained / m.exam.maxMarks >= 0.6 ? 'var(--success)' : 'var(--error)' }}>
                                    {m.marksObtained}/{m.exam.maxMarks}
                                </div>
                                {m.grade && <span className="badge badge-blue">{m.grade}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notices */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📢 School Notices</h2>
                        <Link href="/dashboard/student/notices" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {notices.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">📢</div><div className="empty-state-title">No notices yet</div></div>
                    ) : notices.map((n: any) => (
                        <div key={n.id} style={{ padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', marginBottom: '0.625rem', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{n.title}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>{n.audience}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
