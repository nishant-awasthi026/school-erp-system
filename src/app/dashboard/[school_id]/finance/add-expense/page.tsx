import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { addExpense } from '@/app/actions/finance';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function AddExpensePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    async function handleAddExpense(formData: FormData) {
        'use server';
        await addExpense(school_id, formData);
        redirect(`/dashboard/${school_id}/finance`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Record Expense
            </h1>

            <div className="card">
                <form action={handleAddExpense}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="title">Expense Title *</label>
                            <input id="title" name="title" type="text" className="input-field" required placeholder="e.g., Electric Bill" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="category">Category *</label>
                            <select id="category" name="category" className="input-field" required>
                                <option value="">Select Category</option>
                                <option value="SALARY">Salary</option>
                                <option value="UTILITIES">Utilities</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="SUPPLIES">Supplies</option>
                                <option value="TRANSPORT">Transport</option>
                                <option value="OTHER">Other</option>
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
                            <label className="input-label" htmlFor="description">Description</label>
                            <textarea id="description" name="description" className="input-field" rows={3} placeholder="Optional notes about this expense" />
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
                            Record Expense
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
