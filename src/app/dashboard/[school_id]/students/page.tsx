import db from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function getStudents(schoolId: string) {
    const students = await db.studentProfile.findMany({
        where: { user: { schoolId } },
        include: {
            user: true,
            class: true,
            section: true,
        },
        orderBy: { user: { name: 'asc' } },
    });
    return students;
}

async function getClassesAndSections(schoolId: string) {
    const classes = await db.class.findMany({
        where: { schoolId },
        include: { sections: true },
    });
    return classes;
}

export default async function StudentsPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const students = await getStudents(school_id);
    const classes = await getClassesAndSections(school_id);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    Student Management
                </h1>
                <a
                    href={`/dashboard/${school_id}/students/add`}
                    className="btn btn-primary"
                >
                    Add Student
                </a>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Roll No.</th>
                            <th style={{ padding: '0.75rem' }}>Class</th>
                            <th style={{ padding: '0.75rem' }}>Section</th>
                            <th style={{ padding: '0.75rem' }}>Parent</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No students found. Add your first student to get started.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{student.user.name}</td>
                                    <td style={{ padding: '0.75rem' }}>{student.rollNumber || '-'}</td>
                                    <td style={{ padding: '0.75rem' }}>{student.class.name}</td>
                                    <td style={{ padding: '0.75rem' }}>{student.section.name}</td>
                                    <td style={{ padding: '0.75rem' }}>{student.parentName || '-'}</td>
                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                        <a
                                            href={`/dashboard/${school_id}/students/${student.id}`}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--primary)',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: 'var(--primary)',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            View
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
