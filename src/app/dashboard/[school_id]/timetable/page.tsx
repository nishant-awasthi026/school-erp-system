import db from '@/lib/db';
import { notFound } from 'next/navigation';
import TimetableClient from './TimetableClient';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function TimetablePage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    // Fetch required data for timetable management
    const classes = await db.class.findMany({
        where: { schoolId: school_id },
        include: { sections: true },
        orderBy: { name: 'asc' },
    });

    const subjects = await db.subject.findMany({
        where: { schoolId: school_id },
        orderBy: { name: 'asc' },
    });

    const teachers = await db.teacherProfile.findMany({
        where: { user: { schoolId: school_id } },
        include: { user: true },
    });

    const timetables = await db.timetable.findMany({
        where: { schoolId: school_id },
        include: {
            class: true,
            section: true,
            subject: true,
            teacher: { include: { user: true } },
        },
    });

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📅 Timetable Management</h1>
                    <p className="page-subtitle">View and manage class schedules</p>
                </div>
            </div>

            <TimetableClient 
                schoolId={school_id}
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                timetables={timetables}
            />
        </div>
    );
}
