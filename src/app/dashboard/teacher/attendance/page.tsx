'use client';
import { useState, useEffect } from 'react';

type Student = { id: string; user: { name: string }; rollNumber: string | null };
type TimetableEntry = { id: string; startTime: string; endTime: string; class: { id: string; name: string }; section: { id: string; name: string } | null; subject: { id: string; name: string } };

export default function AttendancePage() {
    const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
    const [selected, setSelected] = useState<TimetableEntry | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const today = new Date().getDay();
        fetch('/api/teacher/timetable').then(r => r.json()).then(d => {
            if (d.success) setTimetableEntries(d.data.filter((t: any) => t.dayOfWeek === today));
        });
    }, []);

    const loadStudents = async (entry: TimetableEntry) => {
        setSelected(entry); setLoadingStudents(true); setDone(false); setAttendance({});
        const res = await fetch(`/api/teacher/attendance?classId=${entry.class.id}`);
        const d = await res.json();
        if (d.success) {
            const studs: Student[] = d.data;
            setStudents(studs);
            const init: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
            studs.forEach(s => { init[s.id] = 'PRESENT'; });
            setAttendance(init);
        }
        setLoadingStudents(false);
    };

    const markAll = (status: 'PRESENT' | 'ABSENT') => {
        const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
        students.forEach(s => { updated[s.id] = status; });
        setAttendance(updated);
    };

    const toggle = (id: string) => {
        setAttendance(a => ({ ...a, [id]: a[id] === 'PRESENT' ? 'ABSENT' : a[id] === 'ABSENT' ? 'LATE' : 'PRESENT' }));
    };

    const submit = async () => {
        if (!selected) return;
        setSubmitting(true);
        const entries = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
        const res = await fetch('/api/teacher/attendance', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timetableId: selected.id, date: new Date().toISOString(), entries }),
        });
        const d = await res.json();
        if (d.success) setDone(true);
        setSubmitting(false);
    };

    const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
    const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;
    const lateCount = Object.values(attendance).filter(s => s === 'LATE').length;

    const statusColor: Record<string, string> = { PRESENT: 'badge-green', ABSENT: 'badge-red', LATE: 'badge-yellow' };
    const statusNext: Record<string, string> = { PRESENT: 'ABSENT', ABSENT: 'LATE', LATE: 'PRESENT' };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">✅ Mark Attendance</h1>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>

            {/* Select Period */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Select Period / Class</div>
                {timetableEntries.length === 0
                    ? <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No classes scheduled for today.</div>
                    : <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {timetableEntries.map(e => (
                            <button key={e.id} onClick={() => loadStudents(e)}
                                className={`btn ${selected?.id === e.id ? 'btn-primary' : 'btn-ghost'}`}>
                                {e.startTime} — Class {e.class.name}{e.section ? `-${e.section.name}` : ''} · {e.subject.name}
                            </button>
                        ))}
                    </div>
                }
            </div>

            {/* Roll Call */}
            {selected && !loadingStudents && (
                <div className="card">
                    {done && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✅ Attendance submitted successfully!</div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Class {selected.class.name}{selected.section ? `-${selected.section.name}` : ''} · {selected.subject.name}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                                <span className="badge badge-green">Present: {presentCount}</span>
                                <span className="badge badge-red">Absent: {absentCount}</span>
                                <span className="badge badge-yellow">Late: {lateCount}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-success btn-sm" onClick={() => markAll('PRESENT')}>All Present</button>
                            <button className="btn btn-danger btn-sm" onClick={() => markAll('ABSENT')}>All Absent</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem', marginBottom: '1.5rem' }}>
                        {students.map(s => {
                            const status = attendance[s.id] || 'PRESENT';
                            return (
                                <button key={s.id} onClick={() => toggle(s.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${status === 'PRESENT' ? 'rgba(16,185,129,0.3)' : status === 'ABSENT' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, background: status === 'PRESENT' ? 'var(--success-light)' : status === 'ABSENT' ? 'var(--error-light)' : 'var(--warning-light)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                                        {s.user.name[0]}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.user.name}</div>
                                        {s.rollNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll #{s.rollNumber}</div>}
                                    </div>
                                    <span className={`badge ${statusColor[status]}`} style={{ fontSize: '0.6875rem', flexShrink: 0 }}>{status}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} onClick={submit} disabled={submitting || done}>
                        {submitting ? '⏳ Submitting...' : done ? '✅ Submitted!' : '📤 Submit Attendance'}
                    </button>
                </div>
            )}

            {loadingStudents && (
                <div className="card"><div className="empty-state"><div className="animate-spin" style={{fontSize:'2rem'}}>⏳</div><div className="empty-state-title">Loading students...</div></div></div>
            )}
        </div>
    );
}
