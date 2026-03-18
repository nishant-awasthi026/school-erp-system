import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

async function getFeesData(userId: string) {
    const profile = await db.studentProfile.findUnique({ where: { userId } });
    if (!profile) return { profile: null, fees: [], total: 0, paid: 0 };

    const fees = await db.monthlyFee.findMany({
        where: { studentId: profile.id },
        include: { payments: { orderBy: { createdAt: 'desc' } } },
        orderBy: { year: 'desc', month: 'desc' },
    });

    const total = fees.reduce((s, f) => s + f.amount, 0);
    const paid = fees.reduce((s, f) => s + f.paidAmount, 0);
    return { profile, fees, total, paid };
}

export default async function StudentFeesPage() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { fees, total, paid } = await getFeesData(user.userId);

    const pending = total - paid;
    const statusColor: Record<string, string> = { PAID: 'badge-green', PENDING: 'badge-yellow', PARTIAL: 'badge-blue', OVERDUE: 'badge-red' };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">💰 Fee & Payments</h1>
            </div>

            <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Fees', value: `₹${total.toLocaleString()}`, icon: '📋', color: 'var(--primary)', bg: 'var(--primary-light)' },
                    { label: 'Amount Paid', value: `₹${paid.toLocaleString()}`, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
                    { label: 'Balance Due', value: `₹${pending.toLocaleString()}`, icon: '⚠️', color: pending > 0 ? 'var(--error)' : 'var(--success)', bg: pending > 0 ? 'var(--error-light)' : 'var(--success-light)' },
                ].map(c => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                        <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                        <div className="stat-card-label">{c.label}</div>
                    </div>
                ))}
            </div>

            {pending > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                    💳 You have ₹{pending.toLocaleString()} outstanding. Please pay at the school&apos;s finance counter or contact admin.
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr><th>Month</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Receipts</th></tr>
                    </thead>
                    <tbody>
                        {fees.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No fee records yet</td></tr>
                        ) : fees.map((f: any) => (
                            <tr key={f.id}>
                                <td style={{ fontWeight: 600 }}>{f.monthName} {f.year}</td>
                                <td>₹{f.amount.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{f.paidAmount.toLocaleString()}</td>
                                <td style={{ color: f.amount - f.paidAmount > 0 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>₹{(f.amount - f.paidAmount).toLocaleString()}</td>
                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(f.dueDate).toLocaleDateString()}</td>
                                <td><span className={`badge ${statusColor[f.status] || 'badge-gray'}`}>{f.status}</span></td>
                                <td>
                                    {f.payments.map((p: any) => (
                                        <span key={p.id} className="badge badge-gray" style={{ marginRight: '0.25rem', fontSize: '0.6875rem' }}>#{p.receiptNumber}</span>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
