// Fee Generation Utility - Generates monthly fees for all students

import db from '@/lib/db';

/**
 * Generate monthly fee records for all active students
 * Should be run on the 1st of each month
 */
export async function generateMonthlyFees(month: string, year: number, monthName: string) {
    // Get all active students with their classes
    const students = await db.studentProfile.findMany({
        where: {
            user: {
                schoolId: { not: null },
            },
            classId: { not: null },
        },
        include: {
            class: {
                include: {
                    feeStructure: true,
                },
            },
            user: true,
        },
    });

    const monthKey = `${year}-${month.padStart(2, '0')}`;
    const dueDate = new Date(year, parseInt(month) - 1, 10); // 10th of the month

    const feeRecords = [];

    for (const student of students) {
        // Skip if no fee structure defined for this class
        if (!student.class.feeStructure) {
            console.log(`No fee structure for class ${student.class.name}`);
            continue;
        }

        // Check if fee already generated for this month
        const existing = await db.monthlyFee.findUnique({
            where: {
                studentId_month: {
                    studentId: student.id,
                    month: monthKey,
                },
            },
        });

        if (existing) {
            console.log(`Fee already generated for ${student.user.name} - ${monthKey}`);
            continue;
        }

        feeRecords.push({
            studentId: student.id,
            month: monthKey,
            year,
            monthName,
            amount: student.class.feeStructure.monthlyAmount,
            paidAmount: 0,
            status: 'PENDING',
            dueDate,
        });
    }

    if (feeRecords.length > 0) {
        await db.monthlyFee.createMany({
            data: feeRecords,
        });
        console.log(`Generated ${feeRecords.length} monthly fee records for ${monthName} ${year}`);
    }

    return feeRecords.length;
}

/**
 * Mark overdue fees
 * Run daily to update status of pending fees past due date
 */
export async function markOverdueFees() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db.monthlyFee.updateMany({
        where: {
            status: { in: ['PENDING', 'PARTIAL'] },
            dueDate: { lt: today },
        },
        data: {
            status: 'OVERDUE',
        },
    });

    console.log(`Marked ${result.count} fees as overdue`);
    return result.count;
}

/**
 * Generate unique receipt number
 */
export async function generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;

    // Get last receipt number for this year
    const lastReceipt = await db.payment.findFirst({
        where: {
            receiptNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            receiptNumber: 'desc',
        },
    });

    let nextNumber = 1;
    if (lastReceipt) {
        const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Get student's pending dues
 */
export async function getStudentDues(studentId: string) {
    const dues = await db.monthlyFee.findMany({
        where: {
            studentId,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        include: {
            payments: true,
            student: {
                include: {
                    user: true,
                    class: true,
                    section: true,
                },
            },
        },
        orderBy: {
            dueDate: 'asc',
        },
    });

    const totalDue = dues.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
    const totalPaid = dues.reduce((sum, fee) => sum + fee.paidAmount, 0);

    return {
        dues,
        totalDue,
        totalPaid,
        student: dues[0]?.student,
    };
}
