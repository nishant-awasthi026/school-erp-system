import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { setFeeStructure } from '@/app/actions/feeStructure';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function SetupFeeStructurePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    // Get all classes that don't have fee structure yet
    const classes = await db.class.findMany({
        where: {
            schoolId: school_id,
            feeStructure: null,
        },
        orderBy: { name: 'asc' },
    });

    async function handleSetup(formData: FormData) {
        'use server';
        const classId = formData.get('classId') as string;
        const monthlyAmount = parseFloat(formData.get('monthlyAmount') as string);

        await setFeeStructure(school_id, classId, monthlyAmount);
        redirect(`/dashboard/${school_id}/finance/fee-structure`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Setup Fee Structure
            </h1>

            <div className="card">
                {classes.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>All classes already have fee structures defined.</p>
                        <a
                            href={`/dashboard/${school_id}/finance/fee-structure`}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem', display: 'inline-block' }}
                        >
                            View Fee Structures
                        </a>
                    </div>
                ) : (
                    <form action={handleSetup}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label" htmlFor="classId">Select Class *</label>
                                <select id="classId" name="classId" className="input-field" required>
                                    <option value="">Choose a class</option>
                                    {classes.map((cls: any) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label" htmlFor="monthlyAmount">Monthly Fee Amount (₹) *</label>
                                <input
                                    id="monthlyAmount"
                                    name="monthlyAmount"
                                    type="number"
                                    className="input-field"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g., 2000"
                                />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    This amount will be auto-generated as monthly fee for all students in this class.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <a
                                href={`/dashboard/${school_id}/finance/fee-structure`}
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
                                Setup Fee Structure
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
