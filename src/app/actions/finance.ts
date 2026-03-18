'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Collect a fee payment for a student's monthly fee record.
 */
export async function collectFeePayment(
    schoolId: string,
    monthlyFeeId: string,
    amount: number,
    method: string,
    collectedBy: string,
) {
    const fee = await db.monthlyFee.findUnique({ where: { id: monthlyFeeId } });
    if (!fee) throw new Error('Monthly fee record not found');

    const receiptNumber = `RCP-${Date.now()}`;
    const newPaid = fee.paidAmount + amount;
    const newStatus = newPaid >= fee.amount ? 'PAID' : 'PARTIAL';

    await db.$transaction([
        db.payment.create({
            data: { receiptNumber, monthlyFeeId, amount, paymentDate: new Date(), method, collectedBy },
        }),
        db.monthlyFee.update({
            where: { id: monthlyFeeId },
            data: { paidAmount: newPaid, status: newStatus },
        }),
    ]);

    revalidatePath(`/dashboard/${schoolId}/finance`);
}

/**
 * Add an expense entry and create a matching ledger debit.
 */
export async function addExpense(schoolId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const amount = formData.get('amount') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (!title || !amount || !category || !date) {
        throw new Error('Required fields are missing');
    }

    await db.$transaction([
        db.expense.create({
            data: { amount: parseFloat(amount), category, description: description || title, date: new Date(date), schoolId },
        }),
        db.ledger.create({
            data: {
                entryType: 'EXPENSE',
                amount: parseFloat(amount),
                description: `${category}: ${title}`,
                date: new Date(date),
                schoolId,
            },
        }),
    ]);

    revalidatePath(`/dashboard/${schoolId}/finance`);
}

/**
 * Add a manual ledger entry (income / expense / adjustment).
 */
export async function addLedgerEntry(schoolId: string, formData: FormData) {
    const entryType = formData.get('entryType') as string;
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (!entryType || !amount || !description || !date) {
        throw new Error('Required fields are missing');
    }

    await db.ledger.create({
        data: { entryType, amount: parseFloat(amount), description, date: new Date(date), schoolId },
    });

    revalidatePath(`/dashboard/${schoolId}/finance`);
}
