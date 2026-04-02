'use client';

import React, { useState } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableClient({ schoolId, classes, subjects, teachers, timetables: initialTimetables }: any) {
    const [timetables, setTimetables] = useState(initialTimetables);
    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form state
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter timetables by selected class
    const classTimetables = timetables.filter((t: any) => t.classId === selectedClass);

    async function handleAddEntry(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch(`/api/schools/${schoolId}/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData)),
            });
            const data = await res.json();
            
            if (!data.success) {
                setFormError(data.error?.message || 'Failed to add entry');
            } else {
                setTimetables([...timetables, data.data]);
                setShowAddModal(false);
            }
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="card flex justify-between items-center" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: 600 }}>Select Class:</label>
                    <select 
                        className="input-field" 
                        value={selectedClass} 
                        onChange={e => setSelectedClass(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>Class {c.name}</option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Entry
                </button>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Day</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Time</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Subject</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Teacher</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Room</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classTimetables.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No timetable entries found for this class.
                                </td>
                            </tr>
                        ) : classTimetables.sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((t: any) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{DAYS[t.dayOfWeek]}</td>
                                <td style={{ padding: '1rem' }}>{t.startTime} - {t.endTime}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className="badge badge-blue">{t.subject.name}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>{t.teacher.user.name}</td>
                                <td style={{ padding: '1rem' }}>{t.roomNumber || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add Timetable Entry</h2>
                        {formError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>{formError}</div>}
                        
                        <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Class</label>
                                <select name="classId" className="input-field" defaultValue={selectedClass} required>
                                    {classes.map((c: any) => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Subject</label>
                                <select name="subjectId" className="input-field" required>
                                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Teacher</label>
                                <select name="teacherId" className="input-field" required>
                                    {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Day</label>
                                    <select name="dayOfWeek" className="input-field" required>
                                        {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Room</label>
                                    <input type="text" name="roomNumber" className="input-field" placeholder="e.g. 101" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Start Time</label>
                                    <input type="time" name="startTime" className="input-field" required />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">End Time</label>
                                    <input type="time" name="endTime" className="input-field" required />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
