'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Create a new notice
 */
export async function createNotice(
    schoolId: string,
    title: string,
    content: string,
    audience: string
) {
    await db.notice.create({
        data: {
            title,
            content,
            audience,
            school: {
                connect: { id: schoolId },
            },
        },
    });

    revalidatePath(`/dashboard/${schoolId}/notices`);
}

/**
 * Update a notice
 */
export async function updateNotice(
    noticeId: string,
    schoolId: string,
    title: string,
    content: string,
    audience: string
) {
    await db.notice.update({
        where: { id: noticeId },
        data: {
            title,
            content,
            audience,
        },
    });

    revalidatePath(`/dashboard/${schoolId}/notices`);
}

/**
 * Delete a notice
 */
export async function deleteNotice(noticeId: string, schoolId: string) {
    await db.notice.delete({
        where: { id: noticeId },
    });

    revalidatePath(`/dashboard/${schoolId}/notices`);
}

/**
 * Get all notices for a school
 */
export async function getNotices(schoolId: string) {
    return await db.notice.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
    });
}
