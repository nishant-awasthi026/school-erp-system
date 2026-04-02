'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function addStudent(schoolId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const className = formData.get('classId') as string;
    const sectionName = formData.get('sectionId') as string;
    const rollNumber = formData.get('rollNumber') as string;
    const dob = formData.get('dob') as string;
    const gender = formData.get('gender') as string;
    const address = formData.get('address') as string;
    const parentName = formData.get('parentName') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const stream = formData.get('stream') as string;

    if (!name || !className || !sectionName) {
        throw new Error('Required fields are missing');
    }

    // Generate a default password (can be changed later)
    const defaultPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Generate email if not provided — append timestamp to avoid unique constraint collisions
    const studentEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@student.school`;

    await db.$transaction(async (tx: any) => {
        // Find or create Class
        let classRecord = await tx.class.findFirst({
            where: { name: className, schoolId },
        });

        if (!classRecord) {
            classRecord = await tx.class.create({
                data: { name: className, schoolId },
            });
        }

        // Find or create Section
        let sectionRecord = await tx.section.findFirst({
            where: { name: sectionName, classId: classRecord.id },
        });

        if (!sectionRecord) {
            sectionRecord = await tx.section.create({
                data: { name: sectionName, classId: classRecord.id },
            });
        }

        const user = await tx.user.create({
            data: {
                name,
                email: studentEmail,
                password: hashedPassword,
                role: 'STUDENT',
                schoolId,
            },
        });

        await tx.studentProfile.create({
            data: {
                userId: user.id,
                classId: classRecord.id,
                sectionId: sectionRecord.id,
                rollNumber,
                dob: dob ? new Date(dob) : null,
                gender,
                address,
                parentName,
                parentPhone,
                stream,
            },
        });
    });

    revalidatePath(`/dashboard/${schoolId}/students`);
}

export async function updateStudent(studentId: string, schoolId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;
    const sectionId = formData.get('sectionId') as string;
    const rollNumber = formData.get('rollNumber') as string;
    const dob = formData.get('dob') as string;
    const gender = formData.get('gender') as string;
    const address = formData.get('address') as string;
    const parentName = formData.get('parentName') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const medicalHistory = formData.get('medicalHistory') as string;
    const behavioralRecords = formData.get('behavioralRecords') as string;

    const studentProfile = await db.studentProfile.findUnique({
        where: { id: studentId },
        include: { user: true },
    });

    if (!studentProfile || studentProfile.user.schoolId !== schoolId) {
        throw new Error('Unauthorized or student not found');
    }

    await db.$transaction(async (tx: any) => {
        await tx.user.update({
            where: { id: studentProfile.userId },
            data: { name },
        });

        await tx.studentProfile.update({
            where: { id: studentId },
            data: {
                classId,
                sectionId,
                rollNumber,
                dob: dob ? new Date(dob) : null,
                gender,
                address,
                parentName,
                parentPhone,
                medicalHistory,
                behavioralRecords,
            },
        });
    });

    revalidatePath(`/dashboard/${schoolId}/students`);
}

export async function deleteStudent(studentId: string, schoolId: string) {
    const studentProfile = await db.studentProfile.findUnique({
        where: { id: studentId },
        include: { user: true },
    });

    if (!studentProfile || studentProfile.user.schoolId !== schoolId) {
        throw new Error('Unauthorized or student not found');
    }

    // Soft delete — preserves all fee, attendance, and marks history
    await db.studentProfile.update({
        where: { id: studentId },
        data: { isActive: false, deletedAt: new Date() },
    });

    revalidatePath(`/dashboard/${schoolId}/students`);
}

export async function generateTC(studentId: string, schoolId: string) {
    const student = await db.studentProfile.findUnique({
        where: { id: studentId },
        include: { user: true, monthlyFees: { where: { status: 'PENDING' } } },
    });

    if (!student || student.user.schoolId !== schoolId) {
        throw new Error('Student not found');
    }

    if (student.monthlyFees.length > 0) {
        throw new Error(`Cannot generate TC: Student has ${student.monthlyFees.length} pending fee payments.`);
    }

    await db.studentProfile.update({
        where: { id: studentId },
        data: {
            admissionStatus: 'ALUMNI',
            isActive: false,
        },
    });

    revalidatePath(`/dashboard/${schoolId}/students/${studentId}`);
    revalidatePath(`/dashboard/${schoolId}/students`);
}

