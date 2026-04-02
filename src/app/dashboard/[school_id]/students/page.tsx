import db from '@/lib/db';
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
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
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
                    </tbody>
                </table>
            </div>
        </div>
    );
}
