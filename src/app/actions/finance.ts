'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateReceiptNumber } from '@/lib/utils/fee-generator';

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

    const receiptNumber = await generateReceiptNumber();
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
    revalidatePath(`/dashboard/${schoolId}/cashier`);
    return receiptNumber;
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

/**
 * Generate monthly fee records for all active students in a class for a given month.
 * If records already exist they are skipped (idempotent).
 */
export async function addFee(schoolId: string, formData: FormData) {
    const classId   = formData.get('classId') as string;
    const month     = formData.get('month') as string;     // "2025-01"
    const monthName = formData.get('monthName') as string; // "January"
    const year      = formData.get('year') as string;
    const dueDate   = formData.get('dueDate') as string;

    if (!classId || !month || !monthName || !year || !dueDate) {
        throw new Error('All fields are required');
    }

    // Get fee structure for the class
    const feeStructure = await db.feeStructure.findUnique({ where: { classId } });
    if (!feeStructure) {
        throw new Error('No fee structure configured for this class');
    }

    // Get all active students in the class
    const students = await db.studentProfile.findMany({
        where: { classId, isActive: true },
        select: { id: true },
    });

    if (students.length === 0) {
        throw new Error('No active students found in this class');
    }

    // Create fee records (skip if already exists for this month)
    await db.$transaction(
        students.map((s) =>
            db.monthlyFee.upsert({
                where: { studentId_month: { studentId: s.id, month } },
                create: {
                    studentId: s.id,
                    month,
                    year: parseInt(year),
                    monthName,
                    amount: feeStructure.monthlyAmount,
                    paidAmount: 0,
                    status: 'PENDING',
                    dueDate: new Date(dueDate),
                },
                update: {}, // no-op if already exists
            })
        )
    );

    revalidatePath(`/dashboard/${schoolId}/finance`);
    return { count: students.length, amount: feeStructure.monthlyAmount };
}
