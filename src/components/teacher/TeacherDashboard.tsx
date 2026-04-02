'use client';
import React, { useState } from 'react';
import '@/app/dashboard.css';
import dynamic from 'next/dynamic';

const TeacherMobileHome = dynamic(() => import('./mobile/TeacherMobileHome'), { ssr: false });
const TeacherMobileSchedule = dynamic(() => import('./mobile/TeacherMobileSchedule'), { ssr: false });
const TeacherMobileAttendance = dynamic(() => import('./mobile/TeacherMobileAttendance'), { ssr: false });
const TeacherMobileAcademics = dynamic(() => import('./mobile/TeacherMobileAcademics'), { ssr: false });

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const renderView = () => {
    switch(activeTab) {
      case 'home': return <TeacherMobileHome />;
      case 'schedule': return <TeacherMobileSchedule />;
      case 'attendance': return <TeacherMobileAttendance />;
      case 'academics': return <TeacherMobileAcademics />;
      default: return <TeacherMobileHome />;
    }
  };

  return (
    <div style={{position: 'relative', minHeight: '100vh', backgroundColor: '#f8f6fb'}}>
      {renderView()}

      <nav className="td-bottom-nav">
        <a href="#" className={`td-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0"}}>home</span>
          <span className="td-nav-label">HOME</span>
        </a>
        <a href="#" className={`td-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('schedule'); }}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: activeTab === 'schedule' ? "'FILL' 1" : "'FILL' 0"}}>calendar_today</span>
          <span className="td-nav-label">SCHEDULE</span>
        </a>
        <a href="#" className={`td-nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('attendance'); }}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: activeTab === 'attendance' ? "'FILL' 1" : "'FILL' 0"}}>how_to_reg</span>
          <span className="td-nav-label">ATTENDANCE</span>
        </a>
        <a href="#" className={`td-nav-item ${activeTab === 'academics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('academics'); }}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: activeTab === 'academics' ? "'FILL' 1" : "'FILL' 0"}}>school</span>
          <span className="td-nav-label">ACADEMICS</span>
        </a>
      </nav>
    </div>
  );
}
