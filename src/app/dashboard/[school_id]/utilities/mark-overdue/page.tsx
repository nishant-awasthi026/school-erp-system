import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { markOverdueFees } from '@/lib/feeGenerator';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function MarkOverduePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    async function handleMarkOverdue() {
        'use server';
        const count = await markOverdueFees();
        redirect(`/dashboard/${school_id}/utilities?marked=${count}`);
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <a
                    href={`/dashboard/${school_id}/utilities`}
                    style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Utilities
                </a>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                ⏰ Mark Overdue Fees
            </h1>

            <div className="card" style={{ marginBottom: '2rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #f59e0b' }}>
                <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>What This Does</h3>
                <ul style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                    <li>Identifies all fee records with status "PENDING" or "PARTIAL"</li>
                    <li>Checks if their due date has passed</li>
                    <li>Updates their status to "OVERDUE" for accurate tracking</li>
                    <li>Helps generate accurate defaulter lists</li>
                </ul>
            </div>

            <div className="card">
                <form action={handleMarkOverdue}>
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏰</div>
                        <h3 style={{ marginBottom: '1rem' }}>Ready to Mark Overdue Fees?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                            This action will scan all pending and partial payments and mark those past their due date as overdue.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <a
                                href={`/dashboard/${school_id}/utilities`}
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
                            <button type="submit" className="btn" style={{ background: '#f59e0b', color: 'white', border: 'none' }}>
                                Mark Overdue Fees
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
