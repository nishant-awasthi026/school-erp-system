import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { getNotices } from '@/app/actions/notices';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function NoticesPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const notices = await getNotices(school_id);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    📢 Notice Board
                </h1>
                <a
                    href={`/dashboard/${school_id}/notices/create`}
                    className="btn btn-primary"
                >
                    + Create Notice
                </a>
            </div>

            {notices.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No Notices Yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Create your first notice to communicate with teachers and students.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {notices.map((notice: any) => (
                        <div key={notice.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {notice.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <span>📅 {new Date(notice.createdAt).toLocaleDateString()}</span>
                                        <span>
                                            👥 <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: notice.audience === 'ALL' ? 'rgba(99, 102, 241, 0.1)' :
                                                    notice.audience === 'TEACHERS' ? 'rgba(16, 185, 129, 0.1)' :
                                                        'rgba(251, 191, 36, 0.1)',
                                                color: notice.audience === 'ALL' ? 'var(--primary)' :
                                                    notice.audience === 'TEACHERS' ? 'var(--success)' :
                                                        '#f59e0b',
                                                fontWeight: '600',
                                            }}>
                                                {notice.audience}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a
                                        href={`/dashboard/${school_id}/notices/edit/${notice.id}`}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--primary)',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--primary)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Edit
                                    </a>
                                </div>
                            </div>
                            <p style={{ lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                                {notice.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
