'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

import bcrypt from 'bcryptjs';

export async function addSchool(formData: FormData) {
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !address || !email || !password) {
        throw new Error('All fields are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.$transaction(async (tx: any) => {
        const school = await tx.school.create({
            data: {
                name,
                address,
                isActive: true,
            },
        });

        await tx.user.create({
            data: {
                name: 'School Admin',
                email,
                password: hashedPassword,
                role: 'SCHOOL_ADMIN',
                schoolId: school.id,
            },
        });
    });

    revalidatePath('/dashboard/super-admin');
}

export async function deleteSchool(schoolId: string) {
    await db.school.delete({
        where: { id: schoolId },
    });
    revalidatePath('/dashboard/super-admin');
}

export async function toggleSchoolStatus(schoolId: string, currentStatus: boolean) {
    await db.school.update({
        where: { id: schoolId },
        data: { isActive: !currentStatus },
    });
    revalidatePath('/dashboard/super-admin');
}

export async function updateSchoolAdmin(schoolId: string, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email) {
        throw new Error('Email is required');
    }

    const data: any = { email };
    if (password) {
        data.password = await bcrypt.hash(password, 10);
    }

    // Find the School Admin for this school
    const adminUser = await db.user.findFirst({
        where: {
            schoolId,
            role: 'SCHOOL_ADMIN',
        },
    });

    if (adminUser) {
        await db.user.update({
            where: { id: adminUser.id },
            data,
        });
    } else {
        // Create if doesn't exist (fallback)
        if (!password) throw new Error('Password required for new admin');
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.user.create({
            data: {
                name: 'School Admin',
                email,
                password: hashedPassword,
                role: 'SCHOOL_ADMIN',
                schoolId,
            },
        });
    }

    revalidatePath('/dashboard/super-admin');
}
