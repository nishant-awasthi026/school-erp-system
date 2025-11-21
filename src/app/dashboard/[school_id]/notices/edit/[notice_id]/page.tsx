import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { updateNotice, deleteNotice } from '@/app/actions/notices';
import DeleteNoticeButton from './DeleteNoticeButton';

interface PageProps {
    params: Promise<{ school_id: string; notice_id: string }>;
}

export default async function EditNoticePage({ params }: PageProps) {
    const { school_id, notice_id } = await params;

    const notice = await db.notice.findUnique({
        where: { id: notice_id },
    });

    if (!notice || notice.schoolId !== school_id) {
        notFound();
    }

    async function handleUpdate(formData: FormData) {
        'use server';
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const audience = formData.get('audience') as string;

        await updateNotice(notice_id, school_id, title, content, audience);
        redirect(`/dashboard/${school_id}/notices`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Edit Notice
            </h1>

            <div className="card">
                <form action={handleUpdate}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="title">Notice Title *</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                className="input-field"
                                required
                                defaultValue={notice.title}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="audience">Audience *</label>
                            <select
                                id="audience"
                                name="audience"
                                className="input-field"
                                required
                                defaultValue={notice.audience}
                            >
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
                                defaultValue={notice.content}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                        <DeleteNoticeButton noticeId={notice_id} schoolId={school_id} />

                        <div style={{ display: 'flex', gap: '1rem' }}>
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
                                💾 Update Notice
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
