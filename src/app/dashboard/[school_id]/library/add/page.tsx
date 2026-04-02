import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function handleAddBook(schoolId: string, formData: FormData) {
    'use server';
    const title       = formData.get('title') as string;
    const author      = formData.get('author') as string;
    const isbn        = formData.get('isbn') as string;
    const publisher   = formData.get('publisher') as string;
    const edition     = formData.get('edition') as string;
    const category    = formData.get('category') as string;
    const totalCopies = parseInt(formData.get('totalCopies') as string) || 1;

    if (!title || !author) throw new Error('Title and author are required');

    await db.libraryBook.create({
        data: { title, author, isbn, publisher, edition, category, totalCopies, available: totalCopies, schoolId },
    });
    redirect(`/dashboard/${schoolId}/library`);
}

export default async function AddBookPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const addBook = handleAddBook.bind(null, school_id);

    const CATEGORIES = ['Academic', 'Science', 'Mathematics', 'Literature', 'History', 'Geography', 'Reference', 'Fiction', 'Non-fiction', 'Other'];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📚 Add Book</h1>
                    <p className="page-subtitle">Add a new book to the library catalogue</p>
                </div>
                <a href={`/dashboard/${school_id}/library`} className="btn btn-ghost">← Back to Library</a>
            </div>

            <div className="card" style={{ maxWidth: '640px' }}>
                <form action={addBook}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label" htmlFor="title">Book Title *</label>
                            <input id="title" name="title" type="text" className="input-field" required placeholder="e.g., Physics Part I" />
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label" htmlFor="author">Author *</label>
                            <input id="author" name="author" type="text" className="input-field" required placeholder="e.g., H.C. Verma" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="isbn">ISBN</label>
                            <input id="isbn" name="isbn" type="text" className="input-field" placeholder="978-..." />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="publisher">Publisher</label>
                            <input id="publisher" name="publisher" type="text" className="input-field" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="edition">Edition</label>
                            <input id="edition" name="edition" type="text" className="input-field" placeholder="e.g., 3rd" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="category">Category</label>
                            <select id="category" name="category" className="input-field">
                                <option value="">— Select —</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="totalCopies">Total Copies *</label>
                            <input id="totalCopies" name="totalCopies" type="number" className="input-field" min="1" defaultValue="1" required />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <a href={`/dashboard/${school_id}/library`}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)' }}>
                            Cancel
                        </a>
                        <button type="submit" className="btn btn-primary">📚 Add Book</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
