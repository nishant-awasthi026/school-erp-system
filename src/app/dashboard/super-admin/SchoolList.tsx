'use client';

import { useState } from 'react';
import { deleteSchool, toggleSchoolStatus, updateSchoolAdmin } from '@/app/actions/school';

interface School {
    id: string;
    name: string;
    address: string | null;
    isActive: boolean;
    users: { email: string }[];
}

export default function SchoolList({ schools }: { schools: School[] }) {
    const [editingSchool, setEditingSchool] = useState<School | null>(null);

    return (
        <>
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Address</th>
                            <th style={{ padding: '0.75rem' }}>Admin Email</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schools.map((school) => {
                            const adminEmail = school.users[0]?.email || 'N/A';
                            return (
                                <tr key={school.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{school.name}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{school.address}</td>
                                    <td style={{ padding: '0.75rem' }}>{adminEmail}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            backgroundColor: school.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: school.isActive ? 'var(--success)' : 'var(--error)'
                                        }}>
                                            {school.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setEditingSchool(school)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--primary)',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: 'var(--primary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <form action={toggleSchoolStatus.bind(null, school.id, school.isActive)}>
                                            <button type="submit" style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border)',
                                                background: 'transparent',
                                                color: 'var(--text-main)',
                                                cursor: 'pointer'
                                            }}>
                                                {school.isActive ? 'Pause' : 'Activate'}
                                            </button>
                                        </form>
                                        <form action={deleteSchool.bind(null, school.id)}>
                                            <button type="submit" style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--error)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: 'var(--error)',
                                                cursor: 'pointer'
                                            }}>
                                                Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingSchool && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            Edit School Admin
                        </h2>
                        <form action={async (formData) => {
                            await updateSchoolAdmin(editingSchool.id, formData);
                            setEditingSchool(null);
                        }}>
                            <div className="input-group">
                                <label className="input-label">School Name</label>
                                <input type="text" className="input-field" value={editingSchool.name} disabled />
                            </div>
                            <div className="input-group">
                                <label className="input-label" htmlFor="edit-email">Admin Email</label>
                                <input
                                    id="edit-email"
                                    name="email"
                                    type="email"
                                    className="input-field"
                                    defaultValue={editingSchool.users[0]?.email}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label" htmlFor="edit-password">New Password (Optional)</label>
                                <input
                                    id="edit-password"
                                    name="password"
                                    type="password"
                                    className="input-field"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditingSchool(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
