import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

async function getHomeworkData(userId: string) {
    const profile = await db.studentProfile.findUnique({ where: { userId } });
    if (!profile) return { profile: null, submissions: [] };

    const homework = await db.homework.findMany({
        where: { classId: profile.classId ?? undefined },
        include: {
            subject: true,
            submissions: { where: { studentId: profile.id }, take: 1 },
            _count: undefined,
        },
        orderBy: { dueDate: 'desc' },
    });

    return { profile, homework };
}

export default async function StudentHomeworkPage() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { homework } = await getHomeworkData(user.userId);

    const statusColor: Record<string, string> = {
        SUBMITTED: 'badge-green', LATE: 'badge-yellow', NOT_SUBMITTED: 'badge-red', PENDING: 'badge-gray',
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">📝 Homework</h1>
                <p className="page-subtitle">{homework?.length ?? 0} assignments</p>
            </div>

            {!homework || homework.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div className="empty-state-title">No homework yet</div>
                    <div className="empty-state-desc">Your teacher has not assigned any homework yet.</div>
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {homework.map((hw: any) => {
                        const submission = hw.submissions?.[0];
                        const subStatus = submission?.status || 'NOT_SUBMITTED';
                        const dueDate = new Date(hw.dueDate);
                        const isOverdue = dueDate < new Date();
                        return (
                            <div key={hw.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>📝</span>
                                        <span style={{ fontWeight: 700 }}>{hw.title}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{hw.description.substring(0, 150)}...</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span className="badge badge-purple">{hw.subject.name}</span>
                                        <span className={`badge ${isOverdue && subStatus === 'NOT_SUBMITTED' ? 'badge-red' : 'badge-gray'}`}>Due: {dueDate.toLocaleDateString()}</span>
                                        <span className={`badge ${statusColor[subStatus] || 'badge-gray'}`}>{subStatus.replace(/_/g, ' ')}</span>
                                        {submission?.grade && <span className="badge badge-blue">Grade: {submission.grade}</span>}
                                    </div>
                                </div>
                                {subStatus === 'NOT_SUBMITTED' && !isOverdue && (
                                    <Link href={`/dashboard/student/homework/${hw.id}/submit`} className="btn btn-primary btn-sm" style={{ flexShrink: 0, marginLeft: '1rem' }}>📤 Submit</Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
