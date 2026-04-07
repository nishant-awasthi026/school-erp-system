'use client';
import React, { useState } from 'react';
import '@/app/dashboard.css';
import '@/app/mobile-features.css';
import { useApi } from '@/hooks/api/useApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  subject: { name: string };
  class: { name: string };
  section?: { name: string } | null;
}

function getStatus(startTime: string, endTime: string): 'ongoing' | 'next' | 'scheduled' {
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = new Date(); start.setHours(sh, sm, 0);
  const end = new Date(); end.setHours(eh, em, 0);
  if (now >= start && now <= end) return 'ongoing';
  if (now < start) return 'next';
  return 'scheduled';
}

export default function TeacherMobileSchedule() {
  const todayIndex = new Date().getDay(); // 0=Sun
  const [activeDay, setActiveDay] = useState<number>(todayIndex === 0 || todayIndex === 6 ? 1 : todayIndex);
  const { data, loading, error } = useApi<TimetableEntry[]>(`/api/teacher/timetable?all=1`);

  const dayEntries = (data ?? []).filter(e => e.dayOfWeek === activeDay);
  const weekStart = (() => {
    const d = new Date();
    const diff = d.getDate() - d.getDay() + 1;
    const mon = new Date(d.setDate(diff));
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    return `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${fri.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  return (
    <div className="mf-container">
      <div className="tt-header-card" style={{ padding: '16px 20px 4px' }}>
        <div className="tt-cal-icon">
          <span className="material-symbols-outlined">calendar_today</span>
        </div>
        <div>
          <h2 className="tt-title">Weekly Timetable</h2>
          <p className="tt-date">{weekStart}</p>
        </div>
        <span className="material-symbols-outlined tt-dots">more_vert</span>
      </div>

      <div className="tt-days-tabs">
        {WEEK_DAYS.map(dayNum => (
          <div
            key={dayNum}
            className={`tt-day-tab ${activeDay === dayNum ? 'active' : ''}`}
            onClick={() => setActiveDay(dayNum)}
          >
            {DAYS[dayNum]}
          </div>
        ))}
      </div>

      <h3 className="tt-section-title">{DAYS[activeDay].toUpperCase()}'S CLASSES</h3>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#5a32fa' }}>progress_activity</span>
        </div>
      )}

      {error && (
        <div style={{ margin: '20px', padding: '16px', background: '#fef2f2', borderRadius: '12px', color: '#e11d48', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {!loading && !error && dayEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>event_available</span>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>No classes scheduled for {DAYS[activeDay]}.</p>
        </div>
      )}

      {dayEntries.map((entry, idx) => {
        const status = entry.dayOfWeek === todayIndex ? getStatus(entry.startTime, entry.endTime) : 'scheduled';
        const sectionStr = entry.section ? `-${entry.section.name}` : '';
        return (
          <React.Fragment key={entry.id}>
            <div className={`tt-card ${status === 'ongoing' ? 'ongoing' : ''}`}>
              <div className="tt-card-header">
                <span className={`tt-badge ${status === 'ongoing' ? 'ongoing' : ''}`}>
                  {status === 'ongoing' ? 'ONGOING' : status === 'next' && idx === dayEntries.findIndex(e => getStatus(e.startTime, e.endTime) === 'next') ? 'NEXT' : 'SCHEDULED'}
                </span>
                <span className="tt-time">{entry.startTime} - {entry.endTime}</span>
              </div>
              <h4 className="tt-class-title">{entry.subject.name}</h4>
              <div className="tt-class-info">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                Grade {entry.class.name}{sectionStr}
                {entry.roomNumber && (
                  <>
                    &nbsp;•&nbsp;
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                    {entry.roomNumber}
                  </>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <button className="td-fab">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
