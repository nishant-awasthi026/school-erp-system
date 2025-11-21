import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { createNotice } from '@/app/actions/notices';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function CreateNoticePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    async function handleCreate(formData: FormData) {
        'use server';
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const audience = formData.get('audience') as string;

        await createNotice(school_id, title, content, audience);
        redirect(`/dashboard/${school_id}/notices`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Create New Notice
            </h1>

            <div className="card">
                <form action={handleCreate}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="title">Notice Title *</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                className="input-field"
                                required
                                placeholder="e.g., School Holiday Announcement"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="audience">Audience *</label>
                            <select id="audience" name="audience" className="input-field" required>
                                <option value="ALL">All (Teachers + Students)</option>
                                <option value="TEACHERS">Teachers Only</option>
                                <option value="STUDENTS">Students Only</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="content">Content *</label>
                            <textarea
                                id="content"
                                name="content"
                                className="input-field"
                                required
                                rows={8}
                                placeholder="Write your notice here..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <a
                            href={`/dashboard/${school_id}/notices`}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                display: 'inline-block',
                            }}
                        >
                            Cancel
                        </a>
                        <button type="submit" className="btn btn-primary">
                            📢 Publish Notice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
