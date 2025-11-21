'use server';

import db from '@/lib/db';
import { generateReceiptNumber } from '@/lib/feeGenerator';
import { revalidatePath } from 'next/cache';

/**
 * Record a payment for monthly fees
 */
export async function recordPayment(
    schoolId: string,
    studentId: string,
    monthlyFeeIds: string[],
    amount: number,
    method: string,
    collectedBy?: string
) {
    const receiptNumber = await generateReceiptNumber();

    // Get the monthly fees being paid
    const monthlyFees = await db.monthlyFee.findMany({
        where: {
            id: { in: monthlyFeeIds },
            studentId,
        },
    });

    if (monthlyFees.length === 0) {
        throw new Error('No valid fees found');
    }

    // Calculate total due
    const totalDue = monthlyFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);

    if (amount > totalDue) {
        throw new Error('Payment amount exceeds total due');
    }

    // Allocate payment across fees (oldest first)
    let remainingAmount = amount;
    const updates = [];

    for (const fee of monthlyFees.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())) {
        if (remainingAmount <= 0) break;

        const feeDue = fee.amount - fee.paidAmount;
        const paymentForThisFee = Math.min(remainingAmount, feeDue);

        const newPaidAmount = fee.paidAmount + paymentForThisFee;
        const newStatus = newPaidAmount >= fee.amount ? 'PAID' : 'PARTIAL';

        updates.push({
            id: fee.id,
            paidAmount: newPaidAmount,
            status: newStatus,
        });

        remainingAmount -= paymentForThisFee;
    }

    // Record payment in transaction
    await db.$transaction(async (tx: any) => {
        // Create payment record (for the first fee, but it covers multiple months)
        const payment = await tx.payment.create({
            data: {
                receiptNumber,
                monthlyFeeId: monthlyFeeIds[0],
                amount,
                method,
                paymentDate: new Date(),
                collectedBy,
            },
        });

        // Update all affected monthly fees
        for (const update of updates) {
            await tx.monthlyFee.update({
                where: { id: update.id },
                data: {
                    paidAmount: update.paidAmount,
                    status: update.status,
                },
            });
        }

        return payment;
    });

    revalidatePath(`/dashboard/${schoolId}/cashier`);
    revalidatePath(`/dashboard/${schoolId}/finance`);

    return receiptNumber;
}

/**
 * Get payment/receipt details
 */
export async function getPaymentByReceipt(receiptNumber: string) {
    const payment = await db.payment.findUnique({
        where: { receiptNumber },
        include: {
            monthlyFee: {
                include: {
                    student: {
                        include: {
                            user: true,
                            class: true,
                            section: true,
                        },
                    },
                },
            },
        },
    });

    return payment;
}

/**
 * Get all payments for a student
 */
export async function getStudentPayments(studentId: string) {
    const payments = await db.payment.findMany({
        where: {
            monthlyFee: { studentId },
        },
        include: {
            monthlyFee: true,
        },
        orderBy: {
            paymentDate: 'desc',
        },
    });

    return payments;
}
