import db from '@/lib/db';
import Link from 'next/link';

async function getEmployees(schoolId: string) {
    return db.user.findMany({
        where: { schoolId, role: 'TEACHER' },
        include: { teacherProfile: true },
        orderBy: { createdAt: 'desc' },
    });
}

export default async function EmployeesPage({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const employees = await getEmployees(school_id);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">👨‍🏫 Teaching Staff</h1>
                    <p className="page-subtitle">{employees.length} staff members</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link href={`/dashboard/${school_id}/employees/import`} className="btn btn-ghost">📥 Bulk Import</Link>
                    <Link href={`/dashboard/${school_id}/employees/add`} className="btn btn-primary">➕ Add Teacher</Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Employee ID</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Qualification</th>
                            <th>Experience</th>
                            <th>Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No teachers yet</td></tr>
                        ) : employees.map((e) => (
                            <tr key={e.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>{e.name[0]}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="badge badge-gray">{e.teacherProfile?.employeeId || '—'}</span></td>
                                <td>{e.teacherProfile?.department || '—'}</td>
                                <td>{e.teacherProfile?.designation || '—'}</td>
                                <td>{e.teacherProfile?.qualification || '—'}</td>
                                <td>{e.teacherProfile?.experience != null ? `${e.teacherProfile.experience} yrs` : '—'}</td>
                                <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                                    {e.teacherProfile?.salary ? `₹${e.teacherProfile.salary.toLocaleString()}` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
