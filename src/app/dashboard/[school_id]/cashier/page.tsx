import db from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function CashierDashboardPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    // Get today's collection summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = await db.payment.findMany({
        where: {
            monthlyFee: {
                student: {
                    user: { schoolId: school_id },
                },
            },
            paymentDate: {
                gte: today,
            },
        },
    });

    const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get all students for search
    const students = await db.user.findMany({
        where: {
            schoolId: school_id,
            role: 'STUDENT',
        },
        include: {
            studentProfile: {
                include: {
                    class: true,
                    section: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                💰 Cashier Dashboard
            </h1>

            {/* Today's Collection */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Today's Collection
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                            ₹{todayCollection.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {todayPayments.length} transactions
                        </div>
                    </div>
                    <div style={{ fontSize: '4rem' }}>💵</div>
                </div>
            </div>

            {/* Search Students */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    🔍 Search Student
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        id="studentSearch"
                        className="input-field"
                        placeholder="Search by student name or roll number..."
                        style={{ fontSize: '1.125rem' }}
                    />
                </div>

                <div id="searchResults" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {students.map((student: any) => (
                        <a
                            key={student.id}
                            href={`/dashboard/${school_id}/cashier/collect/${student.id}`}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'background 0.2s',
                            }}
                            className="student-link"
                        >
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                                    {student.name}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Roll: {student.studentProfile?.rollNumber || 'N/A'} |
                                    Class: {student.studentProfile?.class?.name || 'N/A'} - {student.studentProfile?.section?.name || 'N/A'}
                                </div>
                            </div>
                            <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
                                Collect Payment →
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <script dangerouslySetInnerHTML={{
                __html: `
                document.getElementById('studentSearch').addEventListener('input', (e) => {
                    const search = e.target.value.toLowerCase();
                    const links = document.querySelectorAll('.student-link');
                    links.forEach(link => {
                        const text = link.textContent.toLowerCase();
                        link.style.display = text.includes(search) ? 'flex' : 'none';
                    });
                });
                `
            }} />
        </div>
    );
}
