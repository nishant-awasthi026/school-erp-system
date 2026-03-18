import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { addLedgerEntry } from '@/app/actions/finance';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function AddLedgerPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    async function handleAddEntry(formData: FormData) {
        'use server';
        await addLedgerEntry(school_id, formData);
        redirect(`/dashboard/${school_id}/finance`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Add Ledger Entry
            </h1>

            <div className="card">
                <form action={handleAddEntry}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="entryType">Entry Type *</label>
                            <select id="entryType" name="entryType" className="input-field" required>
                                <option value="">Select Type</option>
                                <option value="INCOME">Income</option>
                                <option value="EXPENSE">Expense</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="amount">Amount (₹) *</label>
                            <input id="amount" name="amount" type="number" className="input-field" required />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="date">Date *</label>
                            <input id="date" name="date" type="date" className="input-field" required />
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label" htmlFor="description">Description *</label>
                            <input id="description" name="description" type="text" className="input-field" required placeholder="Describe this transaction" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <a
                            href={`/dashboard/${school_id}/finance`}
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
                            Add Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
