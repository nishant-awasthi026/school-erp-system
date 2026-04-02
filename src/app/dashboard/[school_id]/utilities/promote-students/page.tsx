import db from '@/lib/db';
import { notFound } from 'next/navigation';
import PromoteClient from './PromoteClient';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function PromoteStudentsPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    // Fetch classes and sections for the dropdowns
    const classes = await db.class.findMany({
        where: { schoolId: school_id },
        include: { sections: true },
        orderBy: { name: 'asc' },
    });

    // Fetch all students (only active) to allow client-side filtering by "From Class"
    const students = await db.studentProfile.findMany({
        where: { user: { schoolId: school_id }, isActive: true, alumniStatus: false },
        include: { user: { select: { name: true, email: true } }, class: true, section: true },
        orderBy: { user: { name: 'asc' } },
    });

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📈 Student Promotion</h1>
                    <p className="page-subtitle">Promote students to the next class at the end of the academic year</p>
                </div>
            </div>

            <PromoteClient 
                schoolId={school_id}
                classes={classes}
                initialStudents={students}
            />
        </div>
    );
}
