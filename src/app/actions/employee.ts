'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function addEmployee(schoolId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string; // TEACHER or STAFF
    const designation = formData.get('designation') as string;
    const qualification = formData.get('qualification') as string;
    const salary = formData.get('salary') as string;

    if (!name || !role) {
        throw new Error('Required fields are missing');
    }

    // Generate a default password
    const defaultPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Generate email if not provided
    const employeeEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@${role.toLowerCase()}.school`;

    await db.$transaction(async (tx: any) => {
        const user = await tx.user.create({
            data: {
                name,
                email: employeeEmail,
                password: hashedPassword,
                role,
                schoolId,
            },
        });

        if (role === 'TEACHER') {
            await tx.teacherProfile.create({
                data: {
                    userId: user.id,
                    designation,
                    qualification,
                    salary: salary ? parseFloat(salary) : null,
                },
            });
        }
    });

    revalidatePath(`/dashboard/${schoolId}/employees`);
}

export async function updateEmployee(employeeId: string, schoolId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const designation = formData.get('designation') as string;
    const qualification = formData.get('qualification') as string;
    const salary = formData.get('salary') as string;
    const feedbackLogs = formData.get('feedbackLogs') as string;

    const employee = await db.user.findUnique({
        where: { id: employeeId },
        include: { teacherProfile: true },
    });

    if (!employee || employee.schoolId !== schoolId) {
        throw new Error('Unauthorized or employee not found');
    }

    await db.$transaction(async (tx: any) => {
        await tx.user.update({
            where: { id: employeeId },
            data: { name },
        });

        if (employee.teacherProfile) {
            await tx.teacherProfile.update({
                where: { userId: employeeId },
                data: {
                    designation,
                    qualification,
                    salary: salary ? parseFloat(salary) : null,
                    feedbackLogs,
                },
            });
        }
    });

    revalidatePath(`/dashboard/${schoolId}/employees`);
}

export async function deleteEmployee(employeeId: string, schoolId: string) {
    const employee = await db.user.findUnique({
        where: { id: employeeId },
    });

    if (!employee || employee.schoolId !== schoolId) {
        throw new Error('Unauthorized or employee not found');
    }

    await db.user.delete({
        where: { id: employeeId },
    });

    revalidatePath(`/dashboard/${schoolId}/employees`);
}

export async function offboardEmployee(employeeId: string, schoolId: string) {
    const employee = await db.user.findUnique({
        where: { id: employeeId },
        include: { teacherProfile: true },
    });

    if (!employee || employee.schoolId !== schoolId) {
        throw new Error('Employee not found');
    }

    await db.$transaction(async (tx: any) => {
        // 1. Deactivate global user
        await tx.user.update({
            where: { id: employeeId },
            data: { isActive: false },
        });

        if (employee.teacherProfile) {
            // 2. Mark teacher as resigned
            await tx.teacherProfile.update({
                where: { userId: employeeId },
                data: { status: 'RESIGNED' },
            });

            // 3. Clear Class Teacher assignments
            await tx.class.updateMany({
                where: { teacherId: employee.teacherProfile.id },
                data: { teacherId: null },
            });

            // 4. Clear Subject assignments
            await tx.subject.updateMany({
                where: { teacherId: employee.teacherProfile.id },
                data: { teacherId: null },
            });

            // 5. Delete future Timetable slots
            await tx.timetable.deleteMany({
                where: { teacherId: employee.teacherProfile.id },
            });
        }
    });

    revalidatePath(`/dashboard/${schoolId}/employees`);
}
