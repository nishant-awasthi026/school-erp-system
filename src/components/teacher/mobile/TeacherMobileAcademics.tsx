'use client';
import React, { useState } from 'react';
import '@/app/dashboard.css';
import '@/app/mobile-features.css';
import { useApi } from '@/hooks/api/useApi';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  class: { name: string };
  subject: { name: string };
  section?: { name: string } | null;
  _count: { submissions: number };
}

export default function TeacherMobileAcademics() {
  const [activeTab, setActiveTab] = useState('Homework');
  const { data: homeworkList, loading, error } = useApi<Homework[]>('/api/teacher/homework');

  return (
    <div className="mf-container">
      <div className="ap-header-card">
        <span className="material-symbols-outlined mf-header-icon">menu</span>
        <h2 className="ap-header-title">Academic Portal</h2>
        <div className="ap-avatar-group">
          <span className="material-symbols-outlined mf-header-icon">notifications</span>
        </div>
      </div>

      <div className="ap-tabs">
        {['Homework', 'Mark Entry', 'Lesson Plans'].map(tab => (
          <div key={tab} className={`ap-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
      </div>

      <div className="ap-stats">
        <div className="ap-stat-card">
          <div className="ap-stat-label">ACTIVE HW</div>
          <div className="ap-stat-value">{loading ? '—' : (homeworkList?.length ?? 0)}</div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-label">TOTAL SUBS</div>
          <div className="ap-stat-value dark">{loading ? '—' : (homeworkList ?? []).reduce((sum, h) => sum + h._count.submissions, 0)}</div>
        </div>
      </div>

      {activeTab === 'Homework' && (
        <>
          <div className="ap-section-header">
            <h3 className="ap-section-title">Active Assignments</h3>
            <span className="ap-new-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> New
            </span>
          </div>

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
          {!loading && !error && (homeworkList ?? []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>assignment</span>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>No active homework yet.</p>
            </div>
          )}

          {(homeworkList ?? []).map((h, i) => (
            <div className="ap-assignment-card" key={h.id}>
              <div className={`ap-assi-cover ${i % 2 === 1 ? 'purple' : ''}`}>
                <span className="ap-assi-tag">GRADE {h.class.name}{h.section ? `-${h.section.name}` : ''}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>
                  {h.subject.name.toLowerCase().includes('math') ? 'calculate' : h.subject.name.toLowerCase().includes('science') || h.subject.name.toLowerCase().includes('chem') ? 'biotech' : 'auto_stories'}
                </span>
              </div>
              <div className="ap-assi-body">
                <h4 className="ap-assi-title">{h.title}</h4>
                <p className="ap-assi-sub">{h.subject.name} • {h.description?.slice(0, 30)}{h.description?.length > 30 ? '...' : ''}</p>
                <div className="ap-assi-meta">
                  <div className="ap-assi-dates">
                    <span className="ap-assi-date">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                      Due: {new Date(h.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="ap-assi-submissions">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                      {h._count.submissions} Submissions
                    </span>
                  </div>
                  <button className="ap-assi-btn">View</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === 'Mark Entry' && (
        <div style={{ padding: '0 20px', color: '#475569', textAlign: 'center', paddingTop: '40px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>grading</span>
          <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>Mark Entry Module</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Coming soon — Use the desktop portal for this feature.</p>
        </div>
      )}

      {activeTab === 'Lesson Plans' && (
        <div style={{ padding: '0 20px', color: '#475569', textAlign: 'center', paddingTop: '40px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>auto_stories</span>
          <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>Lesson Plans Module</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Coming soon — Use the desktop portal for this feature.</p>
        </div>
      )}
    </div>
  );
}
