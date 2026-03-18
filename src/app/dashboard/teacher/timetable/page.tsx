'use client';
import { useState, useEffect } from 'react';

type TimetableEntry = { id: string; dayOfWeek: number; startTime: string; endTime: string; subject: { name: string }; class: { name: string }; section: { name: string } | null; roomNumber: string | null };

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['08:00','08:45','09:30','10:15','11:00','11:45','12:30','13:15','14:00','14:45'];

export default function TimetablePage() {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/teacher/timetable').then(r => r.json()).then(d => {
            if (d.success) setTimetable(d.data);
            setLoading(false);
        });
    }, []);

    const today = new Date().getDay();

    const getEntry = (day: number, time: string) =>
        timetable.find(t => t.dayOfWeek === day && t.startTime === time);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📅 My Timetable</h1>
                    <p className="page-subtitle">Weekly schedule — {timetable.length} periods</p>
                </div>
            </div>

            {loading ? (
                <div className="card"><div className="empty-state"><div className="animate-spin" style={{fontSize:'2rem'}}>⏳</div></div></div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left', background: 'var(--surface-2)', border: '1px solid var(--border)', width: '80px' }}>Time</th>
                                {DAYS.slice(1, 7).map((day, i) => (
                                    <th key={day} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', background: today === i + 1 ? 'var(--primary-light)' : 'var(--surface-2)', color: today === i + 1 ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                        {day}{today === i + 1 ? ' ★' : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TIMES.map(time => (
                                <tr key={time}>
                                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', whiteSpace: 'nowrap', fontWeight: 600 }}>{time}</td>
                                    {[1,2,3,4,5,6].map(day => {
                                        const entry = getEntry(day, time);
                                        return (
                                            <td key={day} style={{ padding: '0.5rem', border: '1px solid var(--border)', background: today === day ? 'rgba(59,130,246,0.03)' : 'transparent', verticalAlign: 'top', minWidth: '120px' }}>
                                                {entry && (
                                                    <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)' }}>{entry.subject.name}</div>
                                                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Class {entry.class.name}{entry.section ? `-${entry.section.name}` : ''}</div>
                                                        {entry.roomNumber && <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{entry.roomNumber}</div>}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
