import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { generateMonthlyFees } from '@/lib/utils/fee-generator';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function GenerateFeesPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString();
    const currentYear = currentDate.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[currentDate.getMonth()];

    async function handleGenerate(formData: FormData) {
        'use server';
        const month = formData.get('month') as string;
        const year = parseInt(formData.get('year') as string);
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex];

        const count = await generateMonthlyFees(month, year, monthName);

        redirect(`/dashboard/${school_id}/utilities?generated=${count}&month=${monthName}&year=${year}`);
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
                💵 Generate Monthly Fees
            </h1>

            <div className="card" style={{ marginBottom: '2rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>How It Works</h3>
                <ul style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                    <li>Select a month and year to generate fees for</li>
                    <li>System will create fee records for ALL students based on their class fee structure</li>
                    <li>Each student will get a monthly fee record with status "PENDING"</li>
                    <li>If a class doesn't have a fee structure set up, students in that class will be skipped</li>
                    <li>Already generated fees for a student-month combination will be skipped</li>
                </ul>
            </div>

            <div className="card">
                <form action={handleGenerate}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="month">Month *</label>
                            <select
                                id="month"
                                name="month"
                                className="input-field"
                                required
                                defaultValue={currentMonth}
                            >
                                {monthNames.map((name, index) => (
                                    <option key={index} value={(index + 1).toString()}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="year">Year *</label>
                            <input
                                id="year"
                                name="year"
                                type="number"
                                className="input-field"
                                required
                                defaultValue={currentYear}
                                min={2020}
                                max={2050}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid #f59e0b' }}>
                        <div style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: '600', marginBottom: '0.5rem' }}>
                            ⚠️ Important
                        </div>
                        <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                            This will generate fee records for the selected month. Make sure you have set up fee structures for all classes before proceeding.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            🚀 Generate Monthly Fees
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
