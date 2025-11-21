import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { getPaymentByReceipt } from '@/app/actions/payment';
import { generateReceiptHTML } from '@/lib/receiptGenerator';

interface PageProps {
    params: Promise<{ school_id: string; receipt_number: string }>;
}

export default async function ReceiptPage({ params }: PageProps) {
    const { school_id, receipt_number } = await params;

    const payment = await getPaymentByReceipt(receipt_number);

    if (!payment || payment.monthlyFee.student.user.schoolId !== school_id) {
        notFound();
    }

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    const student = payment.monthlyFee.student;

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML({
        receiptNumber: payment.receiptNumber,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        className: student.class.name,
        sectionName: student.section.name,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        method: payment.method,
        monthsPaid: [payment.monthlyFee.monthName + ' ' + payment.monthlyFee.year],
        schoolName: school!.name,
    });

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                <a
                    href={`/dashboard/${school_id}/cashier`}
                    style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Cashier Dashboard
                </a>
                <button
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                    🖨️ Print Receipt
                </button>
            </div>

            <div className="card" style={{ marginBottom: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '3rem' }}>✅</div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                            Payment Collected Successfully!
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Receipt #{payment.receiptNumber}
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Preview */}
            <div
                dangerouslySetInnerHTML={{ __html: receiptHTML }}
                style={{
                    background: 'white',
                    color: '#333',
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
            />

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📧 Receipt Delivery</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    Receipt has been generated and is ready to print. Email and SMS delivery will be enabled
                    when Phase 5 (Automation) is implemented.
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .receipt-preview, .receipt-preview * {
                        visibility: visible;
                    }
                    .receipt-preview {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
                `
            }} />
        </div>
    );
}
