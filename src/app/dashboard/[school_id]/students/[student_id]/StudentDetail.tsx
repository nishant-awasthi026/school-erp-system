'use client';

import { useState } from 'react';
import { updateStudent, deleteStudent } from '@/app/actions/student';
import { useRouter } from 'next/navigation';

interface Student {
    id: string;
    rollNumber: string | null;
    dob: Date | null;
    gender: string | null;
    address: string | null;
    parentName: string | null;
    parentPhone: string | null;
    medicalHistory: string | null;
    behavioralRecords: string | null;
    user: {
        id: string;
        name: string;
        email: string;
    };
    class: {
        id: string;
        name: string;
    };
    section: {
        id: string;
        name: string;
    };
}

interface Class {
    id: string;
    name: string;
    sections: { id: string; name: string; }[];
}

export default function StudentDetail({
    student,
    classes,
    schoolId,
}: {
    student: Student;
    classes: Class[];
    schoolId: string;
}) {
    const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'behavioral'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    async function handleUpdate(formData: FormData) {
        await updateStudent(student.id, schoolId, formData);
        setIsEditing(false);
        router.refresh();
    }

    async function handleDelete() {
        if (confirm('Are you sure you want to delete this student?')) {
            await deleteStudent(student.id, schoolId);
            router.push(`/dashboard/${schoolId}/students`);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {student.user.name}
                </h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                            Edit
                        </button>
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

            {/* Tabs */}
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
                        onClick={() => setActiveTab('medical')}
                        style={{
                            padding: '1rem 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'medical' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'medical' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'medical' ? 'bold' : 'normal',
                            cursor: 'pointer',
                        }}
                    >
                        Medical History
                    </button>
                    <button
                        onClick={() => setActiveTab('behavioral')}
                        style={{
                            padding: '1rem 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'behavioral' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'behavioral' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'behavioral' ? 'bold' : 'normal',
                            cursor: 'pointer',
                        }}
                    >
                        Behavioral Audit
                    </button>
                </div>
            </div>

            {/* Tab Content */}
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
                                    defaultValue={student.user.name}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    defaultValue={student.user.email}
                                    disabled
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Roll Number</label>
                                <input
                                    name="rollNumber"
                                    type="text"
                                    className="input-field"
                                    defaultValue={student.rollNumber || ''}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Class</label>
                                <select name="classId" className="input-field" defaultValue={student.class.id} disabled={!isEditing}>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Section</label>
                                <select name="sectionId" className="input-field" defaultValue={student.section.id} disabled={!isEditing}>
                                    {classes.flatMap((cls) =>
                                        cls.sections.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {cls.name} - {section.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Date  of Birth</label>
                                <input
                                    name="dob"
                                    type="date"
                                    className="input-field"
                                    defaultValue={student.dob ? new Date(student.dob).toISOString().split('T')[0] : ''}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Gender</label>
                                <select name="gender" className="input-field" defaultValue={student.gender || ''} disabled={!isEditing}>
                                    <option value="">Select Gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Address</label>
                                <input
                                    name="address"
                                    type="text"
                                    className="input-field"
                                    defaultValue={student.address || ''}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Parent/Guardian Name</label>
                                <input
                                    name="parentName"
                                    type="text"
                                    className="input-field"
                                    defaultValue={student.parentName || ''}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Parent/Guardian Phone</label>
                                <input
                                    name="parentPhone"
                                    type="tel"
                                    className="input-field"
                                    defaultValue={student.parentPhone || ''}
                                    disabled={!isEditing}
                                />
                            </div>
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

                {activeTab === 'medical' && (
                    <form action={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">Medical History</label>
                            <textarea
                                name="medicalHistory"
                                className="input-field"
                                rows={10}
                                defaultValue={student.medicalHistory || ''}
                                disabled={!isEditing}
                                placeholder="Enter medical history, allergies, chronic conditions, etc."
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

                {activeTab === 'behavioral' && (
                    <form action={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">Behavioral Records / Complaint History</label>
                            <textarea
                                name="behavioralRecords"
                                className="input-field"
                                rows={10}
                                defaultValue={student.behavioralRecords || ''}
                                disabled={!isEditing}
                                placeholder="Enter behavioral incidents, complaints, disciplinary actions, etc."
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
