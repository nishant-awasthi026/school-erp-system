import db from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function getClassesWithStudents(schoolId: string) {
    const classes = await db.class.findMany({
        where: { schoolId },
        include: {
            sections: {
                include: {
                    students: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
        orderBy: { name: 'asc' },
    });
    return classes;
}

export default async function ClassesPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const classes = await getClassesWithStudents(school_id);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    Classes
                </h1>
            </div>

            {classes.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        No classes found. Classes are automatically created when you add students.
                    </p>
                    <a href={`/dashboard/${school_id}/students/add`} className="btn btn-primary">
                        Add First Student
                    </a>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {classes.map((classItem: any) => (
                        <div key={classItem.id} className="card">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                {classItem.name}
                            </h2>

                            {classItem.sections.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No sections in this class</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {classItem.sections.map((section: any) => (
                                        <div
                                            key={section.id}
                                            style={{
                                                padding: '1rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--background)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                                    Section {section.name}
                                                </h3>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    fontSize: '0.875rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    color: 'var(--primary)'
                                                }}>
                                                    {section.students.length} {section.students.length === 1 ? 'Student' : 'Students'}
                                                </span>
                                            </div>

                                            {section.students.length === 0 ? (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    No students in this section
                                                </p>
                                            ) : (
                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                    {section.students.map((student: any) => (
                                                        <a
                                                            key={student.id}
                                                            href={`/dashboard/${school_id}/students/${student.id}`}
                                                            className="student-card"
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '0.75rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                background: 'var(--surface)',
                                                                textDecoration: 'none',
                                                                color: 'var(--text-main)',
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: '500' }}>
                                                                    {student.user.name}
                                                                </div>
                                                                {student.rollNumber && (
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                                        Roll No: {student.rollNumber}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
                                                                View →
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
