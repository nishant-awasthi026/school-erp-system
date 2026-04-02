import db from '@/lib/db';
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
            </div>
        </div>
    );
}
