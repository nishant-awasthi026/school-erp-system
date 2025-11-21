'use client';

import { useState } from 'react';
import { recordPayment } from '@/app/actions/payment';
import { useRouter } from 'next/navigation';

interface PaymentCollectionFormProps {
    studentId: string;
    studentProfileId: string;
    schoolId: string;
    dues: any[];
    totalDue: number;
}

export default function PaymentCollectionForm({
    studentId,
    studentProfileId,
    schoolId,
    dues,
    totalDue,
}: PaymentCollectionFormProps) {
    const [selectedFees, setSelectedFees] = useState<string[]>(dues.map(d => d.id));
    const [amount, setAmount] = useState(totalDue.toString());
    const [method, setMethod] = useState('CASH');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const receiptNumber = await recordPayment(
                schoolId,
                studentProfileId,
                selectedFees,
                parseFloat(amount),
                method
            );

            // Redirect to receipt page
            router.push(`/dashboard/${schoolId}/cashier/receipt/${receiptNumber}`);
        } catch (error: any) {
            alert(error.message || 'Failed to record payment');
            setIsSubmitting(false);
        }
    };

    const selectedTotal = dues
        .filter(d => selectedFees.includes(d.id))
        .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

    return (
        <div>
            {/* Dues Table */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    Pending Dues
                </h2>

                {dues.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>All Dues Cleared!</div>
                        <p>This student has no pending fees.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem', width: '50px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFees.length === dues.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFees(dues.map(d => d.id));
                                            } else {
                                                setSelectedFees([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th style={{ padding: '0.75rem' }}>Month</th>
                                <th style={{ padding: '0.75rem' }}>Amount Due</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                                <th style={{ padding: '0.75rem' }}>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dues.map((fee: any) => (
                                <tr key={fee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFees.includes(fee.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedFees([...selectedFees, fee.id]);
                                                } else {
                                                    setSelectedFees(selectedFees.filter(id => id !== fee.id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                        {fee.monthName} {fee.year}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '1.125rem', fontWeight: '600' }}>
                                        ₹{(fee.amount - fee.paidAmount).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            background: fee.status === 'OVERDUE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                            color: fee.status === 'OVERDUE' ? 'var(--error)' : '#f59e0b',
                                            fontWeight: '600',
                                        }}>
                                            {fee.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(fee.dueDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Payment Form */}
            {dues.length > 0 && (
                <form onSubmit={handleSubmit}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            Collect Payment
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label">Amount to Collect (₹) *</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="0"
                                    max={selectedTotal}
                                    step="0.01"
                                    required
                                    style={{ fontSize: '1.5rem', fontWeight: '600' }}
                                />
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Maximum: ₹{selectedTotal.toLocaleString()}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Payment Method *</label>
                                <select
                                    className="input-field"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    required
                                    style={{ fontSize: '1.125rem' }}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="ONLINE">Online</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Selected Fees</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                        {selectedFees.length} month(s)
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Due</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        ₹{selectedTotal.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || selectedFees.length === 0 || !amount}
                            style={{ marginTop: '2rem', width: '100%', fontSize: '1.125rem', padding: '1rem' }}
                        >
                            {isSubmitting ? 'Processing...' : '💳 Collect Payment & Generate Receipt'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
