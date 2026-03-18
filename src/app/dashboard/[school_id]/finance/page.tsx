import db from '@/lib/db';
<<<<<<< HEAD
import Link from 'next/link';

async function getFinanceData(schoolId: string) {
    const [feePending, feePaid, feePartial, recentPayments, defaulters] = await Promise.all([
        db.monthlyFee.count({ where: { status: 'PENDING', student: { user: { schoolId } } } }),
        db.monthlyFee.count({ where: { status: 'PAID', student: { user: { schoolId } } } }),
        db.monthlyFee.count({ where: { status: 'PARTIAL', student: { user: { schoolId } } } }),
        db.payment.findMany({
            take: 10, orderBy: { createdAt: 'desc' },
            include: {
                monthlyFee: {
                    include: {
                        student: { include: { user: { select: { name: true } }, class: true } }
                    }
                }
            }
        }),
        db.monthlyFee.findMany({
            where: { status: { in: ['PENDING', 'PARTIAL'] }, student: { user: { schoolId } } },
            take: 10, orderBy: { dueDate: 'asc' },
            include: {
                student: { include: { user: { select: { name: true } }, class: true } }
            }
        }),
    ]);

    const totalCollected = await db.payment.aggregate({ _sum: { amount: true } });
    return { feePending, feePaid, feePartial, recentPayments, defaulters, totalCollected: totalCollected._sum.amount || 0 };
}

export default async function FinancePage({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const f = await getFinanceData(school_id);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💰 Finance Management</h1>
                    <p className="page-subtitle">Fee collection, payments, and defaulters</p>
                </div>
                <Link href={`/dashboard/${school_id}/finance/collect`} className="btn btn-primary">💳 Collect Fee</Link>
            </div>

            {/* Summary */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Collected', value: `₹${f.totalCollected.toLocaleString()}`, icon: '💰', color: 'var(--success)', bg: 'var(--success-light)' },
                    { label: 'Paid Records', value: f.feePaid, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
                    { label: 'Pending', value: f.feePending, icon: '⚠️', color: 'var(--warning)', bg: 'var(--warning-light)' },
                    { label: 'Partial', value: f.feePartial, icon: '🔸', color: 'var(--info)', bg: 'var(--info-light)' },
                ].map(c => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                        <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                        <div className="stat-card-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-cols-2">
                {/* Recent Payments */}
                <div className="card">
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Recent Payments</h2>
                    {f.recentPayments.length === 0
                        ? <div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-title">No payments collected yet</div></div>
                        : f.recentPayments.map((p: any) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.monthlyFee?.student?.user?.name || 'Student'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.monthlyFee?.monthName} · {p.method}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount.toLocaleString()}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{p.receiptNumber}</div>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Defaulters */}
                <div className="card">
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>⚠️ Due / Defaulters</h2>
                    {f.defaulters.length === 0
                        ? <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">No defaulters — great!</div></div>
                        : f.defaulters.map((d: any) => (
                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.student?.user?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {d.monthName} · Due: {new Date(d.dueDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--error)' }}>₹{(d.amount - d.paidAmount).toLocaleString()}</div>
                                    <span className={`badge ${d.status === 'PENDING' ? 'badge-yellow' : 'badge-red'}`}>{d.status}</span>
                                </div>
                            </div>
                        ))
                    }
                </div>
=======
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function getFinanceData(schoolId: string) {
    const [monthlyFees, expenses, ledger, payments] = await Promise.all([
        db.monthlyFee.findMany({
            where: {
                student: {
                    user: { schoolId },
                },
            },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                        section: true,
                    },
                },
                payments: true,
            },
            orderBy: { dueDate: 'desc' },
        }),
        db.expense.findMany({
            where: { schoolId },
            orderBy: { date: 'desc' },
        }),
        db.ledger.findMany({
            where: { schoolId },
            orderBy: { date: 'desc' },
        }),
        db.payment.findMany({
            where: {
                monthlyFee: {
                    student: {
                        user: { schoolId },
                    },
                },
            },
            include: {
                monthlyFee: {
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
            orderBy: { paymentDate: 'desc' },
            take: 50,
        }),
    ]);

    return { monthlyFees, expenses, ledger, payments };
}

export default async function FinanceReportsPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const { monthlyFees, expenses, ledger, payments } = await getFinanceData(school_id);

    // Calculate totals
    const totalIncome = monthlyFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalOutstanding = monthlyFees.reduce(
        (sum, fee) => sum + (fee.amount - fee.paidAmount),
        0
    );

    // Calculate defaulters
    const defaulters = monthlyFees.filter(
        (fee) => fee.status === 'OVERDUE'
    );

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                📊 Finance Reports
            </h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid var(--success)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Total Income
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        ₹{totalIncome.toLocaleString()}
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)', border: '1px solid var(--error)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Total Expenses
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error)' }}>
                        ₹{totalExpenses.toLocaleString()}
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Outstanding Dues
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        ₹{totalOutstanding.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Defaulters */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    ⚠️ Defaulters ({defaulters.length})
                </h2>

                {defaulters.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <div>No defaulters! All payments are up to date.</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem' }}>Student</th>
                                <th style={{ padding: '0.75rem' }}>Class</th>
                                <th style={{ padding: '0.75rem' }}>Month</th>
                                <th style={{ padding: '0.75rem' }}>Amount Due</th>
                                <th style={{ padding: '0.75rem' }}>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {defaulters.slice(0, 20).map((fee: any) => (
                                <tr key={fee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                        {fee.student.user.name}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {fee.student.class.name} - {fee.student.section.name}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {fee.monthName} {fee.year}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: 'var(--error)', fontWeight: '600' }}>
                                        ₹{(fee.amount - fee.paidAmount).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                        {new Date(fee.dueDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Recent Payments */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    💳 Recent Payments
                </h2>

                {payments.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No payments recorded yet.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem' }}>Receipt #</th>
                                <th style={{ padding: '0.75rem' }}>Student</th>
                                <th style={{ padding: '0.75rem' }}>Amount</th>
                                <th style={{ padding: '0.75rem' }}>Method</th>
                                <th style={{ padding: '0.75rem' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment: any) => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {payment.receiptNumber}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                        {payment.monthlyFee.student.user.name}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                                        ₹{payment.amount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            color: 'var(--primary)',
                                        }}>
                                            {payment.method}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
            </div>
        </div>
    );
}
