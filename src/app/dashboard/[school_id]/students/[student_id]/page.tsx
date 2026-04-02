import db from '@/lib/db';
import { notFound } from 'next/navigation';
import StudentDetail from './StudentDetail';

interface PageProps {
    params: Promise<{ school_id: string; student_id: string }>;
}

async function getStudent(studentId: string, schoolId: string) {
    const student = await db.studentProfile.findUnique({
        where: { id: studentId },
        include: {
            user: true,
            class: true,
            section: true,
        },
    });

    if (!student || student.user.schoolId !== schoolId) {
        return null;
    }

    return student;
}

async function getClassesAndSections(schoolId: string) {
    const classes = await db.class.findMany({
        where: { schoolId },
        include: { sections: true },
        orderBy: { name: 'asc' },
    });
    return classes;
}

export default async function StudentDetailPage({ params }: PageProps) {
    const { school_id, student_id } = await params;

    const student = await getStudent(student_id, school_id);
    if (!student) {
        notFound();
    }

    const classes = await getClassesAndSections(school_id);

    return <StudentDetail student={student as any} classes={classes} schoolId={school_id} />;
}
