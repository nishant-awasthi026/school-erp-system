'use client';
import React from 'react';
import '../app/dashboard.css';
import { useApi } from '@/hooks/api/useApi';

interface DashboardData {
  teacher: { name: string; department?: string; designation?: string };
  todayClasses: Array<{
    id: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    class: { name: string };
    section?: { name: string } | null;
  }>;
  pendingGrading: number;
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
  attendanceQuick: {
    className: string;
    subject: string;
    timetableId: string;
    totalStudents: number;
    presentCount: number;
    isSubmitted: boolean;
  } | null;
  school?: { logoUrl: string | null; name: string };
}

function ClassCard({ cls, idx }: { cls: DashboardData['todayClasses'][0]; idx: number }) {
  const sectionName = cls.section?.name ?? '';
  const labelClass = idx === 0 ? 'td-schedule-card blue' : 'td-schedule-card purple';
  return (
    <div className={labelClass}>
      <div>
        <div className="td-time" style={idx > 0 ? { color: '#6b7280' } : {}}>
          {cls.startTime} — {cls.endTime}
        </div>
        <h4 className="td-class-title">{cls.subject.name}</h4>
        <div className="td-class-sub">Class {cls.class.name}{sectionName ? `-${sectionName}` : ''}</div>
      </div>
      {idx === 0 && (
        <div className="td-status">
          <div className="td-dot"></div> In Progress
        </div>
      )}
      {idx > 0 && <div className="td-status purple">Upcoming</div>}
    </div>
  );
}

export default function TeacherMobileHome() {
  const { data, loading, error } = useApi<DashboardData>('/api/teacher/dashboard');

  if (loading) {
    return (
      <div className="dashboard-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#5a32fa', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: '12px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-root" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#e11d48' }}>error_outline</span>
        <h3 style={{ color: '#e11d48', marginTop: '12px' }}>Could not load dashboard</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>{error ?? 'Unknown error'}</p>
      </div>
    );
  }

  const firstName = data.teacher.name?.split(' ')[0] ?? 'Teacher';

  return (
    <div className="dashboard-root" style={{ paddingBottom: '20px', minHeight: 'auto' }}>
      <header className="td-header">
        <div className="td-header-left">
          {data.school?.logoUrl ? (
            <img src={data.school.logoUrl} alt="Logo" className="td-profile-pic" style={{ objectFit: 'contain', background: 'transparent' }} />
          ) : (
            <div className="td-profile-pic" style={{ background: '#ddd6fe', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '18px', color: '#5a32fa' }}>
              {data.school?.name.charAt(0) ?? 'S'}
            </div>
          )}
          <span className="td-logo-text">{data.school?.name ?? 'The Fluid Scholar'}</span>
        </div>
        <span className="material-symbols-outlined td-bell">notifications</span>
      </header>

      <h1 className="td-welcome-title">Welcome back,<br/>{firstName}</h1>
      <p className="td-welcome-sub">
        You have {data.todayClasses.length} classes scheduled for today.
        {data.teacher.department ? ` Dept: ${data.teacher.department}.` : ''}
      </p>

      {data.todayClasses.length > 0 && (
        <>
          <div className="td-section-header">
            <h3 className="td-section-title">Today's Schedule</h3>
            <a href="#" className="td-section-link">View All</a>
          </div>
          <div className="td-schedule-scroll">
            {data.todayClasses.slice(0, 3).map((cls, i) => <ClassCard key={cls.id} cls={cls} idx={i} />)}
          </div>
        </>
      )}

      {data.attendanceQuick && (
        <div className="td-attendance-card">
          <div>
            <h3 className="td-attendance-title">Attendance</h3>
            <p className="td-attendance-sub">
              Quick-mark for {data.attendanceQuick.subject} ({data.attendanceQuick.className})
            </p>
          </div>
          <div className="td-attendance-stats">
            <span className="td-attendance-big">{data.attendanceQuick.presentCount}</span>
            <span className="td-attendance-small">/{data.attendanceQuick.totalStudents}</span>
            <div className="td-attendance-divider"></div>
            <span className="td-attendance-present">
              {data.attendanceQuick.totalStudents > 0
                ? Math.round((data.attendanceQuick.presentCount / data.attendanceQuick.totalStudents) * 100)
                : 0}% Present
            </span>
          </div>
          <button className="td-btn-open">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>checklist_rtl</span>
            {data.attendanceQuick.isSubmitted ? 'View Attendance' : 'Mark Attendance'}
          </button>
        </div>
      )}

      <div className="td-section-header">
        <h3 className="td-section-title">Pending Grading</h3>
        <span className="td-badge">{data.pendingGrading} Pending</span>
      </div>

      {data.announcements.length > 0 && (
        <div className="td-announcements-card" style={{ marginBottom: '20px' }}>
          <h3 className="td-section-title" style={{ marginBottom: '20px' }}>Announcements</h3>
          {data.announcements.slice(0, 2).map((a, i) => (
            <div className="td-announcement-item" key={a.id}>
              <div className={`td-icon-circle ${i % 2 === 0 ? 'red' : 'blue'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  {i % 2 === 0 ? 'campaign' : 'info'}
                </span>
              </div>
              <div>
                <h4 className="td-announcement-title">{a.title}</h4>
                <p className="td-announcement-desc">{a.body?.slice(0, 80)}...</p>
              </div>
            </div>
          ))}
          <a href="#" className="td-read-all">
            Read all announcements <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </a>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
