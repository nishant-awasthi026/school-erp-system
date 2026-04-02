import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

const FINE_PER_DAY = 1.00; // ₹1 per day overdue

async function handleReturnBook(schoolId: string, formData: FormData) {
    'use server';
    const issueId = formData.get('issueId') as string;
    if (!issueId) throw new Error('Issue ID is required');

    const issue = await db.bookIssue.findUnique({ where: { id: issueId } });
    if (!issue || issue.returnedAt) throw new Error('Invalid or already returned issue');

    const today = new Date();
    const dueDate = new Date(issue.dueDate);
    const overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const fineAmount = overdueDays * FINE_PER_DAY;

    await db.$transaction([
        db.bookIssue.update({
            where: { id: issueId },
            data: { returnedAt: today, fineAmount, finePaid: fineAmount === 0 },
        }),
        db.libraryBook.update({
            where: { id: issue.bookId },
            data: { available: { increment: 1 } },
        }),
    ]);

    redirect(`/dashboard/${schoolId}/library`);
}

export default async function ReturnBookPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const activeIssues = await db.bookIssue.findMany({
        where: { returnedAt: null, book: { schoolId: school_id } },
        include: {
            book: { select: { title: true, author: true } },
            member: { include: { user: { select: { name: true } } } },
        },
        orderBy: { dueDate: 'asc' },
    });

    const returnBook = handleReturnBook.bind(null, school_id);
    const today = new Date();

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📥 Return Book</h1>
                    <p className="page-subtitle">{activeIssues.length} books currently issued</p>
                </div>
                <a href={`/dashboard/${school_id}/library`} className="btn btn-ghost">← Back to Library</a>
            </div>

            {activeIssues.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <div className="empty-state-title">No books currently issued</div>
                </div></div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th>Student</th>
                                <th>Issued On</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Fine</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeIssues as any[]).map(issue => {
                                const isOverdue = new Date(issue.dueDate) < today;
                                const overdueDays = isOverdue
                                    ? Math.floor((today.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                                    : 0;
                                const fine = overdueDays * FINE_PER_DAY;
                                return (
                                    <tr key={issue.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{issue.book.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{issue.book.author}</div>
                                        </td>
                                        <td>{issue.member?.user?.name || '—'}</td>
                                        <td style={{ fontSize: '0.8125rem' }}>{new Date(issue.issuedAt).toLocaleDateString()}</td>
                                        <td style={{ fontSize: '0.8125rem' }}>{new Date(issue.dueDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`}>
                                                {isOverdue ? `Overdue ${overdueDays}d` : 'Issued'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: fine > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                                            {fine > 0 ? `₹${fine.toFixed(2)}` : '—'}
                                        </td>
                                        <td>
                                            <form action={returnBook} style={{ display: 'inline' }}>
                                                <input type="hidden" name="issueId" value={issue.id} />
                                                <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                                                    📥 Return
                                                </button>
                                            </form>
                                        </td>
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
