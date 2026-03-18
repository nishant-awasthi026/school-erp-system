import db from '@/lib/db';
import Link from 'next/link';

async function getLibraryData(schoolId: string) {
    const [books, recentIssues] = await Promise.all([
        db.libraryBook.findMany({
            where: { schoolId },
            orderBy: { createdAt: 'desc' },
        }),
        db.bookIssue.findMany({
            take: 10, orderBy: { issuedAt: 'desc' },
            include: {
                book: { select: { title: true } },
                member: { include: { user: { select: { name: true } } } },
            }
        }),
    ]);
    return { books, recentIssues };
}

export default async function LibraryPage({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const { books, recentIssues } = await getLibraryData(school_id);
    const totalAvailable = books.reduce((s, b) => s + b.available, 0);
    const totalBooks = books.reduce((s, b) => s + b.totalCopies, 0);
    const overdueCount = recentIssues.filter((i: any) => !i.returnedAt && new Date(i.dueDate) < new Date()).length;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📚 Library Management</h1>
                    <p className="page-subtitle">{books.length} titles · {totalBooks} total copies</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/dashboard/${school_id}/library/issue`} className="btn btn-ghost">📤 Issue Book</Link>
                    <Link href={`/dashboard/${school_id}/library/add`} className="btn btn-primary">➕ Add Book</Link>
                </div>
            </div>

            <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Books', value: totalBooks, icon: '📚', color: 'var(--primary)', bg: 'var(--primary-light)' },
                    { label: 'Available', value: totalAvailable, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
                    { label: 'Overdue', value: overdueCount, icon: '⚠️', color: 'var(--warning)', bg: 'var(--warning-light)' },
                ].map(c => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                        <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                        <div className="stat-card-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-cols-2">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>📗 Book Catalogue</div>
                    <table className="data-table">
                        <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Available</th></tr></thead>
                        <tbody>
                            {books.length === 0
                                ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No books added yet</td></tr>
                                : books.map(b => (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 500 }}>{b.title}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{b.author}</td>
                                        <td><span className="badge badge-blue">{b.category || 'General'}</span></td>
                                        <td>
                                            <span className={`badge ${b.available > 0 ? 'badge-green' : 'badge-red'}`}>{b.available}/{b.totalCopies}</span>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>📋 Recent Transactions</h2>
                    {recentIssues.length === 0
                        ? <div className="empty-state"><div className="empty-state-icon">📚</div><div className="empty-state-title">No transactions yet</div></div>
                        : recentIssues.map((issue: any) => {
                            const isOverdue = !issue.returnedAt && new Date(issue.dueDate) < new Date();
                            return (
                                <div key={issue.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{issue.book.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{issue.member?.user?.name} · Issued: {new Date(issue.issuedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        {issue.returnedAt
                                            ? <span className="badge badge-green">Returned</span>
                                            : <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`}>{isOverdue ? 'Overdue' : 'Issued'}</span>
                                        }
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
}
