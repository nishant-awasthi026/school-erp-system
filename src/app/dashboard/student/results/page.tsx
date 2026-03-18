import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

async function getResults(userId: string) {
    const profile = await db.studentProfile.findUnique({ where: { userId } });
    if (!profile) return { marks: [] };

    const marks = await db.mark.findMany({
        where: { studentId: profile.id },
        include: { exam: { include: { subject: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return { marks };
}

export default async function StudentResultsPage() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { marks } = await getResults(user.userId);

    const overall = marks.length > 0
        ? Math.round(marks.reduce((s, m) => s + m.marksObtained / m.exam.maxMarks, 0) / marks.length * 100)
        : null;

    const gradeColor = (pct: number) => {
        if (pct >= 90) return 'badge-green';
        if (pct >= 75) return 'badge-blue';
        if (pct >= 60) return 'badge-yellow';
        return 'badge-red';
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏆 Results & Report Card</h1>
                    <p className="page-subtitle">{marks.length} exams taken</p>
                </div>
                {overall !== null && (
                    <div style={{ textAlign: 'center', padding: '0.75rem 1.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '2rem', color: overall >= 75 ? 'var(--success)' : overall >= 60 ? 'var(--warning)' : 'var(--error)' }}>{overall}%</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Average</div>
                    </div>
                )}
            </div>

            {marks.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-title">No results published yet</div>
                    <div className="empty-state-desc">Results will appear here once your teacher publishes them.</div>
                </div></div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Subject</th><th>Exam</th><th>Marks Obtained</th><th>Max Marks</th><th>Percentage</th><th>Grade</th><th>Remarks</th></tr>
                        </thead>
                        <tbody>
                            {marks.map((m: any) => {
                                const pct = Math.round((m.marksObtained / m.exam.maxMarks) * 100);
                                return (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 600 }}>{m.exam.subject.name}</td>
                                        <td><span className="badge badge-gray">{m.exam.name}</span></td>
                                        <td style={{ fontWeight: 700, color: pct >= 60 ? 'var(--success)' : 'var(--error)' }}>{m.marksObtained}</td>
                                        <td>{m.exam.maxMarks}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'var(--surface-highlight)', borderRadius: '999px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)', borderRadius: '999px' }} />
                                                </div>
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{pct}%</span>
                                            </div>
                                        </td>
                                        <td>{m.grade ? <span className={`badge ${gradeColor(pct)}`}>{m.grade}</span> : '—'}</td>
                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{m.remarks || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
