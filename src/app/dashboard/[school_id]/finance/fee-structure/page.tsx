import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { getAllFeeStructures } from '@/app/actions/feeStructure';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function FeeStructurePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const feeStructures = await getAllFeeStructures(school_id);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    Fee Structure Management
                </h1>
                <a
                    href={`/dashboard/${school_id}/finance/fee-structure/setup`}
                    className="btn btn-primary"
                >
                    Setup Fee Structure
                </a>
            </div>

            <div className="card">
                {feeStructures.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>No Fee Structures Defined</h3>
                        <p>Set up monthly fee amounts for each class to start generating fees.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem' }}>Class</th>
                                <th style={{ padding: '0.75rem' }}>Monthly Fee</th>
                                <th style={{ padding: '0.75rem' }}>Students</th>
                                <th style={{ padding: '0.75rem' }}>Last Updated</th>
                                <th style={{ padding: '0.75rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeStructures.map((structure: any) => (
                                <tr key={structure.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                        {structure.class.name}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ fontSize: '1.125rem', color: 'var(--primary)', fontWeight: '600' }}>
                                            ₹{structure.monthlyAmount.toLocaleString()}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>/month</span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {structure.class._count.students} students
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(structure.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                        <a
                                            href={`/dashboard/${school_id}/finance/fee-structure/edit/${structure.classId}`}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--primary)',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: 'var(--primary)',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            Edit
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card" style={{ marginTop: '2rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>💡 How Fee Structures Work</h3>
                <ul style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                    <li>Define a monthly fee amount for each class</li>
                    <li>System auto-generates fee records on the 1st of each month</li>
                    <li>Cashier collects payments and generates receipts</li>
                    <li>Track month-wise collection and identify defaulters</li>
                </ul>
            </div>
        </div>
    );
}
