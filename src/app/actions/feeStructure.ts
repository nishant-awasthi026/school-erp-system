'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Add or update fee structure for a class
 */
export async function setFeeStructure(
    schoolId: string,
    classId: string,
    monthlyAmount: number,
    components?: string
) {
    // Check if fee structure already exists
    const existing = await db.feeStructure.findUnique({
        where: { classId },
    });

    if (existing) {
        await db.feeStructure.update({
            where: { classId },
            data: {
                monthlyAmount,
                components,
            },
        });
    } else {
        await db.feeStructure.create({
            data: {
                classId,
                schoolId,
                monthlyAmount,
                components,
            },
        });
    }

    revalidatePath(`/dashboard/${schoolId}/finance`);
}

/**
 * Get fee structure for a class
 */
export async function getFeeStructure(classId: string) {
    return await db.feeStructure.findUnique({
        where: { classId },
        include: {
            class: true,
        },
    });
}

/**
 * Get all fee structures for a school
 */
export async function getAllFeeStructures(schoolId: string) {
    return await db.feeStructure.findMany({
        where: { schoolId },
        include: {
            class: {
                include: {
                    _count: {
                        select: { students: true },
                    },
                },
            },
        },
        orderBy: {
            class: { name: 'asc' },
        },
    });
}

/**
 * Delete fee structure
 */
export async function deleteFeeStructure(classId: string, schoolId: string) {
    await db.feeStructure.delete({
        where: { classId },
    });

    revalidatePath(`/dashboard/${schoolId}/finance`);
}
