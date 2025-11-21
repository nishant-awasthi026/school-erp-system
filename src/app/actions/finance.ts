'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function addFee(schoolId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const amount = formData.get('amount') as string;
    const dueDate = formData.get('dueDate') as string;
    const studentId = formData.get('studentId') as string;

    if (!title || !amount || !dueDate) {
        throw new Error('Required fields are missing');
    }

    const fee = await db.fee.create({
        data: {
            name: title,
            amount: parseFloat(amount),
            dueDate: new Date(dueDate),
            schoolId,
        },
    });

    // Create fee record for specific student or all students
    if (studentId) {
        await db.feeRecord.create({
            data: {
                feeId: fee.id,
                studentId,
                status: 'PENDING',
            },
        });
    } else {
        // Create for all students
        const students = await db.studentProfile.findMany({
            where: { user: { schoolId } },
        });

        await db.feeRecord.createMany({
            data: students.map((student: any) => ({
                feeId: fee.id,
                studentId: student.id,
                status: 'PENDING',
            })),
        });
    }

    revalidatePath(`/dashboard/${schoolId}/finance`);
}


export async function recordPayment(feeRecordId: string, schoolId: string, formData: FormData) {
    const amount = formData.get('amount') as string;
    const method = formData.get('method') as string;

    if (!amount || !method) {
        throw new Error('Required fields are missing');
    }

    const feeRecord = await db.feeRecord.findUnique({
        where: { id: feeRecordId },
        include: { fee: true },
    });

    if (!feeRecord || feeRecord.fee.schoolId !== schoolId) {
        throw new Error('Unauthorized or fee record not found');
    }

    await db.$transaction(async (tx: any) => {
        await tx.payment.create({
            data: {
                amount: parseFloat(amount),
                paymentDate: new Date(),
                method,
                feeRecordId,
            },
        });

        const newAmountPaid = feeRecord.paidAmount + parseFloat(amount);
        const newStatus = newAmountPaid >= feeRecord.fee.amount ? 'PAID' : 'PARTIAL';

        await tx.feeRecord.update({
            where: { id: feeRecordId },
            data: {
                paidAmount: newAmountPaid,
                status: newStatus,
            },
        });
    });

    revalidatePath(`/dashboard/${schoolId}/finance`);
}

export async function addExpense(schoolId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const amount = formData.get('amount') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (!title || !amount || !category || !date) {
        throw new Error('Required fields are missing');
    }

    await db.expense.create({
        data: {
            title,
            amount: parseFloat(amount),
            category,
            description,
            date: new Date(date),
            schoolId,
        },
    });

    // Also add to ledger
    await db.ledger.create({
        data: {
            entryType: 'EXPENSE',
            amount: parseFloat(amount),
            description: `${category}: ${title}`,
            date: new Date(date),
            schoolId,
        },
    });

    revalidatePath(`/dashboard/${schoolId}/finance`);
}

export async function addLedgerEntry(schoolId: string, formData: FormData) {
    const entryType = formData.get('entryType') as string;
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (!entryType || !amount || !description || !date) {
        throw new Error('Required fields are missing');
    }

    await db.ledger.create({
        data: {
            entryType,
            amount: parseFloat(amount),
            description,
            date: new Date(date),
            schoolId,
        },
    });

    revalidatePath(`/dashboard/${schoolId}/finance`);
}
