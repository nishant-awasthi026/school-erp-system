import db from '@/lib/db';
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
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
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
                    </tbody>
                </table>
            </div>
        </div>
    );
}
