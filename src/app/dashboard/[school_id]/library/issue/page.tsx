import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function handleIssueBook(schoolId: string, formData: FormData) {
    'use server';
    const bookId    = formData.get('bookId') as string;
    const studentId = formData.get('studentId') as string;
    const dueDate   = formData.get('dueDate') as string;

    if (!bookId || !studentId || !dueDate) throw new Error('All fields are required');

    // Check book availability
    const book = await db.libraryBook.findUnique({ where: { id: bookId } });
    if (!book || book.available <= 0) throw new Error('Book is not available for issue');

    // Check if student already has an active issue of this book
    const existing = await db.bookIssue.findFirst({
        where: { bookId, memberId: studentId, returnedAt: null },
    });
    if (existing) throw new Error('Student already has this book issued');

    await db.$transaction([
        db.bookIssue.create({
            data: { bookId, memberId: studentId, memberType: 'STUDENT', dueDate: new Date(dueDate) },
        }),
        db.libraryBook.update({
            where: { id: bookId },
            data: { available: { decrement: 1 } },
        }),
    ]);

    redirect(`/dashboard/${schoolId}/library`);
}

export default async function IssueBookPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const [books, students] = await Promise.all([
        db.libraryBook.findMany({
            where: { schoolId: school_id, available: { gt: 0 } },
            orderBy: { title: 'asc' },
        }),
        db.studentProfile.findMany({
            where: { user: { schoolId: school_id }, isActive: true },
            include: { user: { select: { name: true } }, class: true },
            orderBy: { user: { name: 'asc' } },
        }),
    ]);

    const issueBook = handleIssueBook.bind(null, school_id);

    // Default due date: 14 days from now
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    const defaultDueStr = defaultDue.toISOString().split('T')[0];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📤 Issue Book</h1>
                    <p className="page-subtitle">Issue an available book to a student</p>
                </div>
                <a href={`/dashboard/${school_id}/library`} className="btn btn-ghost">← Back to Library</a>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                {books.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <div className="empty-state-title">No books available</div>
                        <div className="empty-state-desc">All books are currently issued or the library is empty.</div>
                        <a href={`/dashboard/${school_id}/library/add`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            Add Books
                        </a>
                    </div>
                ) : (
                    <form action={issueBook}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label" htmlFor="bookId">Book *</label>
                                <select id="bookId" name="bookId" className="input-field" required>
                                    <option value="">— Select a book —</option>
                                    {(books as any[]).map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.title} — {b.author} ({b.available}/{b.totalCopies} available)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="studentId">Student *</label>
                                <select id="studentId" name="studentId" className="input-field" required>
                                    <option value="">— Select a student —</option>
                                    {(students as any[]).map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.user.name} — Class {s.class?.name || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="dueDate">Due Date *</label>
                                <input id="dueDate" name="dueDate" type="date" className="input-field"
                                    defaultValue={defaultDueStr} required />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Standard lending period is 14 days
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <a href={`/dashboard/${school_id}/library`}
                                style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)' }}>
                                Cancel
                            </a>
                            <button type="submit" className="btn btn-primary">📤 Issue Book</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
