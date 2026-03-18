// Receipt Generation Utility

interface ReceiptData {
    receiptNumber: string;
    studentName: string;
    rollNumber: string | null;
    className: string;
    sectionName: string;
    paymentDate: Date;
    amount: number;
    method: string;
    monthsPaid: string[];
    schoolName: string;
    collectedBy?: string;
}

/**
 * Generate HTML receipt
 */
export function generateReceiptHTML(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fee Receipt - ${data.receiptNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .receipt-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .receipt-header h1 {
            margin: 0;
            font-size: 24px;
        }
        .receipt-header p {
            margin: 5px 0;
            color: #666;
        }
        .receipt-number {
            text-align: right;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .receipt-details {
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-label {
            font-weight: bold;
        }
        .payment-summary {
            background: #f5f5f5;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #10b981;
            text-align: right;
        }
        .months-paid {
            margin: 15px 0;
        }
        .month-badge {
            display: inline-block;
            background: #6366f1;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            margin: 3px;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body {
                margin: 0;
                padding: 10mm;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-header">
        <h1>${data.schoolName}</h1>
        <p>Fee Payment Receipt</p>
    </div>

    <div class="receipt-number">
        Receipt No: ${data.receiptNumber}
    </div>

    <div class="receipt-details">
        <div class="detail-row">
            <span class="detail-label">Student Name:</span>
            <span>${data.studentName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Roll Number:</span>
            <span>${data.rollNumber || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Class:</span>
            <span>${data.className} - ${data.sectionName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Date:</span>
            <span>${data.paymentDate.toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span>${data.method}</span>
        </div>
        ${data.collectedBy ? `
        <div class="detail-row">
            <span class="detail-label">Collected By:</span>
            <span>${data.collectedBy}</span>
        </div>
        ` : ''}
    </div>

    <div class="months-paid">
        <strong>Months Paid:</strong><br>
        ${data.monthsPaid.map(month => `<span class="month-badge">${month}</span>`).join('')}
    </div>

    <div class="payment-summary">
        <div class="detail-row" style="border: none;">
            <span class="detail-label">Total Amount Paid:</span>
            <span class="total-amount">₹${data.amount.toLocaleString()}</span>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated receipt.</p>
        <p>Receipt sent via email and SMS to registered contact.</p>
        <p>For queries, contact school administration.</p>
    </div>
</body>
</html>
    `;
}

/**
 * Generate plain text receipt for SMS
 */
export function generateReceiptSMS(data: ReceiptData): string {
    return `${data.schoolName}
Fee Receipt: ${data.receiptNumber}
Student: ${data.studentName}
Class: ${data.className}-${data.sectionName}
Amount: ₹${data.amount}
Months: ${data.monthsPaid.join(', ')}
Date: ${data.paymentDate.toLocaleDateString()}
Thank you!`;
}
