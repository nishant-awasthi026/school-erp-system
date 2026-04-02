'use client';

import { useState } from 'react';
import { updateEmployee, deleteEmployee, offboardEmployee } from '@/app/actions/employee';
import { useRouter } from 'next/navigation';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    teacherProfile: {
        id: string;
        designation: string | null;
        qualification: string | null;
        salary: number | null;
        feedbackLogs: string | null;
        status: string | null;
    } | null;
}

export default function EmployeeDetail({
    employee,
    schoolId,
}: {
    employee: Employee;
    schoolId: string;
}) {
    const [activeTab, setActiveTab] = useState<'profile' | 'salary' | 'feedback'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    async function handleUpdate(formData: FormData) {
        await updateEmployee(employee.id, schoolId, formData);
        setIsEditing(false);
        router.refresh();
    }

    async function handleDelete() {
        if (confirm('Are you sure you want to delete this employee?')) {
            await deleteEmployee(employee.id, schoolId);
            router.push(`/dashboard/${schoolId}/employees`);
        }
    }

    async function handleOffboard() {
        if (confirm('Are you sure you want to offboard this staff member? This will deactivate their login and clear their assigned classes. This action is irreversible.')) {
            try {
                await offboardEmployee(employee.id, schoolId);
                router.refresh();
            } catch (e: any) {
                alert(e.message);
            }
        }
    }

    const isTeacher = employee.role === 'TEACHER';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {employee.name}
                    </h1>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.875rem',
                        borderRadius: 'var(--radius-sm)',
                        background: employee.role === 'TEACHER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                        color: employee.role === 'TEACHER' ? 'var(--primary)' : '#a855f7',
                        marginTop: '0.5rem',
                        display: 'inline-block',
                    }}>
                        {employee.role}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isEditing && (
                        <>
                            {employee.isActive && isTeacher && (
                                <button onClick={handleOffboard} className="btn btn-warning">
                                    🚪 Offboard / Resign
                                </button>
                            )}
                            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                                Edit
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--error)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            cursor: 'pointer',
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {isTeacher && (
                <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <button
                            onClick={() => setActiveTab('profile')}
                            style={{
                                padding: '1rem 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
                                cursor: 'pointer',
                            }}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('salary')}
                            style={{
                                padding: '1rem 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'salary' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'salary' ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === 'salary' ? 'bold' : 'normal',
                                cursor: 'pointer',
                            }}
                        >
                            Salary Details
                        </button>
                        <button
                            onClick={() => setActiveTab('feedback')}
                            style={{
                                padding: '1rem 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'feedback' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'feedback' ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === 'feedback' ? 'bold' : 'normal',
                                cursor: 'pointer',
                            }}
                        >
                            Feedback Logs
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                {activeTab === 'profile' && (
                    <form action={handleUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    className="input-field"
                                    defaultValue={employee.name}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    defaultValue={employee.email}
                                    disabled
                                />
                            </div>

                            {isTeacher && (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">Designation</label>
                                        <input
                                            name="designation"
                                            type="text"
                                            className="input-field"
                                            defaultValue={employee.teacherProfile?.designation || ''}
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Qualification</label>
                                        <input
                                            name="qualification"
                                            type="text"
                                            className="input-field"
                                            defaultValue={employee.teacherProfile?.qualification || ''}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {isEditing && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {activeTab === 'salary' && isTeacher && (
                    <form action={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">Monthly Salary</label>
                            <input
                                name="salary"
                                type="number"
                                className="input-field"
                                defaultValue={employee.teacherProfile?.salary || ''}
                                disabled={!isEditing}
                                placeholder="Enter monthly salary amount"
                            />
                        </div>

                        {isEditing && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {activeTab === 'feedback' && isTeacher && (
                    <form action={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">Teacher Feedback Logs</label>
                            <textarea
                                name="feedbackLogs"
                                className="input-field"
                                rows={10}
                                defaultValue={employee.teacherProfile?.feedbackLogs || ''}
                                disabled={!isEditing}
                                placeholder="Enter teacher performance reviews, parent feedback, observation notes, etc."
                            />
                        </div>

                        {isEditing && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
