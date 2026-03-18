'use client';

import { useState } from 'react';
import { addStudent } from '@/app/actions/student';
import { useRouter } from 'next/navigation';

const CLASS_OPTIONS = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
    'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

const SECTION_OPTIONS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const STREAM_OPTIONS = ['Science', 'Arts', 'Commerce'];

export default function AddStudentForm({ schoolId }: { schoolId: string }) {
    const [selectedClass, setSelectedClass] = useState('');
    const router = useRouter();

    const showStream = selectedClass === 'Class 11' || selectedClass === 'Class 12';

    async function handleSubmit(formData: FormData) {
        await addStudent(schoolId, formData);
        router.push(`/dashboard/${schoolId}/students`);
    }

    return (
        <form action={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                    <label className="input-label" htmlFor="name">Full Name *</label>
                    <input id="name" name="name" type="text" className="input-field" required />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="email">Email (Optional)</label>
                    <input id="email" name="email" type="email" className="input-field" placeholder="Auto-generated if left blank" />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="rollNumber">Roll Number</label>
                    <input id="rollNumber" name="rollNumber" type="text" className="input-field" />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="classId">Class *</label>
                    <select
                        id="classId"
                        name="classId"
                        className="input-field"
                        required
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {CLASS_OPTIONS.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="sectionId">Section *</label>
                    <select id="sectionId" name="sectionId" className="input-field" required>
                        <option value="">Select Section</option>
                        {SECTION_OPTIONS.map((section) => (
                            <option key={section} value={section}>{section}</option>
                        ))}
                    </select>
                </div>

                {showStream && (
                    <div className="input-group">
                        <label className="input-label" htmlFor="stream">Stream *</label>
                        <select id="stream" name="stream" className="input-field" required>
                            <option value="">Select Stream</option>
                            {STREAM_OPTIONS.map((stream) => (
                                <option key={stream} value={stream.toUpperCase()}>{stream}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="input-group">
                    <label className="input-label" htmlFor="dob">Date of Birth</label>
                    <input id="dob" name="dob" type="date" className="input-field" />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="gender">Gender</label>
                    <select id="gender" name="gender" className="input-field">
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="address">Address</label>
                    <input id="address" name="address" type="text" className="input-field" />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="parentName">Parent/Guardian Name</label>
                    <input id="parentName" name="parentName" type="text" className="input-field" />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="parentPhone">Parent/Guardian Phone</label>
                    <input id="parentPhone" name="parentPhone" type="tel" className="input-field" />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <a
                    href={`/dashboard/${schoolId}/students`}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        textDecoration: 'none',
                        display: 'inline-block',
                    }}
                >
                    Cancel
                </a>
                <button type="submit" className="btn btn-primary">
                    Add Student
                </button>
            </div>
        </form>
    );
}
