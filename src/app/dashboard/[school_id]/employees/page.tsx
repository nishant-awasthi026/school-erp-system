import db from '@/lib/db';
<<<<<<< HEAD
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
=======
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function getEmployees(schoolId: string) {
    const employees = await db.user.findMany({
        where: {
            schoolId,
            role: { in: ['TEACHER', 'STAFF'] },
        },
        include: {
            teacherProfile: true,
        },
        orderBy: { name: 'asc' },
    });
    return employees;
}

export default async function EmployeesPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const employees = await getEmployees(school_id);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    Employee Management
                </h1>
                <a
                    href={`/dashboard/${school_id}/employees/add`}
                    className="btn btn-primary"
                >
                    Add Employee
                </a>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Role</th>
                            <th style={{ padding: '0.75rem' }}>Designation</th>
                            <th style={{ padding: '0.75rem' }}>Email</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
<<<<<<< HEAD
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
=======
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No employees found. Add your first employee to get started.
                                </td>
                            </tr>
                        ) : (
                            employees.map((employee: any) => (
                                <tr key={employee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{employee.name}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: employee.role === 'TEACHER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                            color: employee.role === 'TEACHER' ? 'var(--primary)' : '#a855f7'
                                        }}>
                                            {employee.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {employee.teacherProfile?.designation || '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {employee.email}
                                    </td>
                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                        <a
                                            href={`/dashboard/${school_id}/employees/${employee.id}`}
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
