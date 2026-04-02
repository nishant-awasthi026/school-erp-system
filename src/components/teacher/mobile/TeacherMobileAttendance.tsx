'use client';
import React, { useState, useEffect } from 'react';
import '../app/dashboard.css';
import '../app/mobile-features.css';
import { usePost } from '@/hooks/api/useApi';

interface StudentRow {
  id: string;
  rollNumber?: string | null;
  user: { name: string };
  status: 'P' | 'A' | 'L';
}

interface TimetableEntry {
  id: string;
  startTime: string;
  endTime: string;
  subject: { name: string };
  class: { id: string; name: string };
  section?: { id: string; name: string } | null;
}

export default function TeacherMobileAttendance({ onBack }: { onBack?: () => void }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableEntry | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [toggles, setToggles] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load today's timetable
  useEffect(() => {
    fetch('/api/teacher/timetable')
      .then(r => r.json())
      .then(j => {
        const entries: TimetableEntry[] = j.data ?? [];
        setTimetable(entries);
        if (entries.length > 0) setSelectedTimetable(entries[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load students when timetable selected
  useEffect(() => {
    if (!selectedTimetable) return;
    setStudentsLoading(true);
    fetch(`/api/teacher/attendance?classId=${selectedTimetable.class.id}`)
      .then(r => r.json())
      .then(j => {
        const raw = j.data ?? [];
        setStudents(raw.map((s: { id: string; rollNumber?: string | null; user: { name: string } }) => ({ ...s, status: 'P' as const })));
        if (j.toggles) {
            setToggles(j.toggles);
        } else {
            setToggles({ PRESENT: true, ABSENT: true, LATE: true, ON_DUTY: false, MEDICAL_LEAVE: false });
        }
      })
      .finally(() => setStudentsLoading(false));
  }, [selectedTimetable]);

  const updateStatus = (id: string, status: 'P' | 'A' | 'L') => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const markAll = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'P' as const })));
  };

  const submitAttendance = async () => {
    if (!selectedTimetable) return;
    setSubmitting(true);
    const statusMap: Record<string, string> = { P: 'PRESENT', A: 'ABSENT', L: 'LATE', O: 'ON_DUTY', M: 'MEDICAL_LEAVE' };
    await fetch('/api/teacher/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({
        timetableId: selectedTimetable.id,
        date: new Date().toISOString(),
        entries: students.map(s => ({ studentId: s.id, status: statusMap[s.status] })),
      }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (loading) {
    return (
      <div className="mf-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#5a32fa' }}>progress_activity</span>
      </div>
    );
  }

  return (
    <div className="mf-container">
      <div className="mf-header">
        {onBack && <span className="material-symbols-outlined mf-header-icon" onClick={onBack} style={{ cursor: 'pointer' }}>arrow_back</span>}
        <h2 className="mf-header-title">Mark Attendance</h2>
        <span className="material-symbols-outlined mf-header-icon">history</span>
      </div>

      {timetable.length > 0 && (
        <div className="att-filters">
          <div className="att-select-group">
            <label className="att-label">Period</label>
            <select className="att-select" onChange={e => setSelectedTimetable(timetable.find(t => t.id === e.target.value) ?? null)}>
              {timetable.map(t => (
                <option key={t.id} value={t.id}>
                  {t.subject.name} ({t.startTime})
                </option>
              ))}
            </select>
          </div>
          <div className="att-select-group">
            <label className="att-label">Class</label>
            <select className="att-select" disabled>
              <option>{selectedTimetable ? `${selectedTimetable.class.name}${selectedTimetable.section ? `-${selectedTimetable.section.name}` : ''}` : 'Select period'}</option>
            </select>
          </div>
        </div>
      )}

      <div className="att-search-bar">
        <span className="material-symbols-outlined att-search-icon">search</span>
        <input type="text" className="att-search-input" placeholder="Search students by name or roll no." />
      </div>

      <div className="att-list-header">
        <span className="att-total">TOTAL STUDENTS: {students.length}</span>
        <span className="att-mark-all" onClick={markAll}>Mark all Present</span>
      </div>

      {studentsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#5a32fa' }}>progress_activity</span>
          <p style={{ marginTop: '8px', fontWeight: 600, fontSize: '13px' }}>Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>person_off</span>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>No students found in this class.</p>
        </div>
      ) : (
        students.map(s => (
          <div className="att-student-card" key={s.id}>
            <div className="att-student-info">
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dde9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: '#2563eb', flexShrink: 0 }}>
                {s.user.name?.charAt(0)}
              </div>
              <div>
                <h4 className="att-student-name">{s.user.name}</h4>
                <p className="att-student-roll">Roll No: {s.rollNumber ?? 'N/A'}</p>
               </div>
            </div>
            <div className="att-btn-group">
              {toggles.PRESENT && <button className={`att-btn p ${s.status === 'P' ? 'active' : ''}`} onClick={() => updateStatus(s.id, 'P')}>P</button>}
              {toggles.ABSENT && <button className={`att-btn a ${s.status === 'A' ? 'active' : ''}`} onClick={() => updateStatus(s.id, 'A')}>A</button>}
              {toggles.LATE && <button className={`att-btn l ${s.status === 'L' ? 'active' : ''}`} onClick={() => updateStatus(s.id, 'L')} style={{ background: s.status === 'L' ? '#8b5cf6' : 'white', color: s.status === 'L' ? 'white' : '#64748b' }}>L</button>}
              {toggles.ON_DUTY && <button className={`att-btn o ${s.status === 'O' as any ? 'active' : ''}`} onClick={() => updateStatus(s.id, 'O' as any)} style={{ background: s.status === 'O' as any ? '#14b8a6' : 'white', color: s.status === 'O' as any ? 'white' : '#64748b' }}>OD</button>}
              {toggles.MEDICAL_LEAVE && <button className={`att-btn m ${s.status === 'M' as any ? 'active' : ''}`} onClick={() => updateStatus(s.id, 'M' as any)} style={{ background: s.status === 'M' as any ? '#f59e0b' : 'white', color: s.status === 'M' as any ? 'white' : '#64748b' }}>M</button>}
            </div>
          </div>
        ))
      )}

      <div className="att-submit-container">
        {submitted && (
          <div style={{ background: '#22c55e', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 700, marginBottom: '8px' }}>
            ✓ Attendance submitted successfully!
          </div>
        )}
        <button className="att-submit-btn" onClick={submitAttendance} disabled={submitting || students.length === 0}>
          <span className="material-symbols-outlined">how_to_reg</span>
          {submitting ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </div>
    </div>
  );
}
