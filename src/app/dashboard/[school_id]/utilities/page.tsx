import db from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function UtilitiesPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                🛠️ School Utilities
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {/* Generate Monthly Fees */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💵</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Generate Monthly Fees
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Auto-create fee records for all students for the current month based on class fee structures.
                    </p>
                    <a
                        href={`/dashboard/${school_id}/utilities/generate-fees`}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        Generate Fees →
                    </a>
                </div>

                {/* School Settings */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid var(--success)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        School Settings
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Update school name, contact information, and other configuration settings.
                    </p>
                    <a
                        href={`/dashboard/${school_id}/utilities/settings`}
                        className="btn"
                        style={{ width: '100%', background: 'var(--success)', color: 'white', border: 'none' }}
                    >
                        Manage Settings →
                    </a>
                </div>

                {/* Mark Overdue Fees */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid #f59e0b' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Mark Overdue Fees
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Update status of pending fees past their due date to "OVERDUE" for accurate tracking.
                    </p>
                    <a
                        href={`/dashboard/${school_id}/utilities/mark-overdue`}
                        className="btn"
                        style={{ width: '100%', background: '#f59e0b', color: 'white', border: 'none' }}
                    >
                        Mark Overdue →
                    </a>
                </div>

                {/* System Reports */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)', border: '1px solid #8b5cf6' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        System Reports
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        View comprehensive reports on students, employees, finances, and attendance.
                    </p>
                    <button
                        className="btn"
                        style={{ width: '100%', background: '#8b5cf6', color: 'white', border: 'none', opacity: 0.6, cursor: 'not-allowed' }}
                        disabled
                    >
                        Coming Soon
                    </button>
                </div>
            </div>
        </div>
    );
}
