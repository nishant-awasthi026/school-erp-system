import db from '@/lib/db';
<<<<<<< HEAD
import Link from 'next/link';

async function getStudents(schoolId: string) {
    return db.user.findMany({
        where: { schoolId, role: 'STUDENT' },
        include: {
            studentProfile: {
                include: {
                    class: true,
                    section: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
}

export default async function StudentsPage({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const students = await getStudents(school_id);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🎓 Students</h1>
                    <p className="page-subtitle">{students.length} students enrolled</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/dashboard/${school_id}/students/import`} className="btn btn-ghost">📥 Bulk Import</Link>
                    <Link href={`/dashboard/${school_id}/students/add`} className="btn btn-primary">➕ Admit Student</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>ID</th>
                            <th>Class / Section</th>
                            <th>Roll No</th>
                            <th>Guardian</th>
                            <th>Status</th>
                            <th>Actions</th>
=======
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
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
<<<<<<< HEAD
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No students yet. <Link href={`/dashboard/${school_id}/students/add`} style={{ color: 'var(--primary)' }}>Admit your first student →</Link>
                            </td></tr>
                        ) : students.map((s) => (
                            <tr key={s.id} className="student-card">
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                                            {s.name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="badge badge-gray">{s.studentProfile?.studentId || '—'}</span></td>
                                <td>{s.studentProfile?.class?.name ? `Class ${s.studentProfile.class.name}${s.studentProfile.section ? ' - ' + s.studentProfile.section.name : ''}` : '—'}</td>
                                <td>{s.studentProfile?.rollNumber || '—'}</td>
                                <td style={{ fontSize: '0.8125rem' }}>{s.studentProfile?.parentName || '—'}</td>
                                <td><span className={`badge ${s.studentProfile?.isActive !== false ? 'badge-green' : 'badge-red'}`}>{s.studentProfile?.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/dashboard/${school_id}/students/${s.id}`} className="btn btn-ghost btn-sm">View</Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
=======
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
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
                    </tbody>
                </table>
            </div>
        </div>
    );
}
