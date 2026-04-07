'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '@/hooks/api/useApi';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
interface DashboardData {
  profile: { name: string; studentId?: string; class?: string; section?: string; avatarUrl?: string | null };
  attendance: { percent: number; present: number; total: number };
  homework: Array<{ id: string; title: string; subject: string; dueDate: string; status: string }>;
  timetable: Array<{ id: string; subject: string; teacher: string; startTime: string; endTime: string; roomNumber?: string | null }>;
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
  school?: { logoUrl: string | null; name: string };
}

interface HomeworkItem {
  id: string; title: string; description: string; subject: string; teacher: string;
  dueDate: string; status: string; submittedAt?: string | null; grade?: string | null;
  remarks?: string | null; isTomorrowSubject: boolean; isOverdue: boolean; submissionId?: string | null;
}

interface HomeworkData { homework: HomeworkItem[]; tomorrowSubjects: string[] }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_DAYS = [1, 2, 3, 4, 5];

/* ═══════════════════════════════════════════
   HELPERS / SHARED STYLES
═══════════════════════════════════════════ */
const BG = '#0a0f1e';
const SURFACE = '#131c2e';
const SURFACE2 = '#1a2438';
const BLUE = '#3b82f6';
const GREEN = '#10b981';
const RED = '#ef4444';
const YELLOW = '#f59e0b';

function PageWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px 16px 100px', color: '#f1f5f9' }}>{children}</div>;
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontWeight: 900, fontSize: '22px', marginBottom: '16px', color: '#f1f5f9' }}>{children}</h2>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: SURFACE2, borderRadius: '14px', padding: '16px', marginBottom: '12px', ...style }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, [string, string]> = {
    SUBMITTED: [GREEN, 'DONE'],
    PENDING: [BLUE, 'PENDING'],
    LATE: [YELLOW, 'LATE'],
    NOT_SUBMITTED: [RED, 'MISSED'],
  };
  const [color, label] = cfg[status] ?? [BLUE, status];
  return (
    <span style={{ fontSize: '10px', fontWeight: 800, color: 'white', background: color, padding: '3px 8px', borderRadius: '6px', flexShrink: 0 }}>
      {label}
    </span>
  );
}

function SubTab({ tabs, active, setActive }: { tabs: string[]; active: string; setActive: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '2px' }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setActive(t)} style={{
          flexShrink: 0, padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '12px', background: active === t ? BLUE : SURFACE2,
          color: active === t ? 'white' : '#64748b', boxShadow: active === t ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
        }}>{t}</button>
      ))}
    </div>
  );
}

function Empty({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: '50px', color: '#64748b' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '52px' }}>{icon}</span>
      <p style={{ marginTop: '10px', fontWeight: 700, color: '#94a3b8', fontSize: '15px' }}>{text}</p>
      {sub && <p style={{ fontSize: '12px', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '36px', color: BLUE }}>progress_activity</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOMEWORK TAB
═══════════════════════════════════════════ */
function HomeworkTab() {
  const [view, setView] = useState<'pending' | 'all'>('pending');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<HomeworkItem | null>(null);
  const [submitText, setSubmitText] = useState('');
  const [submitted, setSubmitted] = useState<string[]>([]);
  const { data, loading, error } = useApi<HomeworkData>('/api/student/homework');

  const hw = data?.homework ?? [];
  const tomorrowSubs = data?.tomorrowSubjects ?? [];
  const pending = hw.filter(h => h.status !== 'SUBMITTED');
  const displayed = view === 'pending' ? pending : hw;

  async function handleSubmit() {
    if (!submitModal) return;
    setSubmitting(submitModal.id);
    const res = await fetch('/api/student/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeworkId: submitModal.id, textContent: submitText }),
    });
    if (res.ok) { setSubmitted(prev => [...prev, submitModal.id]); }
    setSubmitting(null);
    setSubmitModal(null);
    setSubmitText('');
  }

  return (
    <PageWrap>
      <PageTitle>Homework</PageTitle>
      <SubTab tabs={['Pending', 'All Homework']} active={view === 'pending' ? 'Pending' : 'All Homework'} setActive={t => setView(t === 'Pending' ? 'pending' : 'all')} />

      {tomorrowSubs.length > 0 && (
        <Card style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: BLUE, fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#f1f5f9' }}>Tomorrow's Classes: {tomorrowSubs.join(', ')}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Homework for these subjects shown first</div>
            </div>
          </div>
        </Card>
      )}

      {loading ? <Loader /> : error ? (
        <p style={{ color: RED, textAlign: 'center' }}>Failed to load homework</p>
      ) : displayed.length === 0 ? (
        <Empty icon="assignment_turned_in" text={view === 'pending' ? "You're all caught up!" : "No homework yet"} sub={view === 'pending' ? "No pending homework." : undefined} />
      ) : (
        displayed.map(h => {
          const isDone = h.status === 'SUBMITTED' || submitted.includes(h.id);
          const isUrgent = !isDone && new Date(h.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;
          return (
            <Card key={h.id} style={{ borderLeft: `3px solid ${isDone ? GREEN : h.isTomorrowSubject ? YELLOW : isUrgent ? RED : BLUE}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1, paddingRight: '10px' }}>
                  {h.isTomorrowSubject && !isDone && (
                    <div style={{ fontSize: '10px', fontWeight: 800, color: YELLOW, marginBottom: '4px' }}>⚡ TOMORROW'S CLASS</div>
                  )}
                  <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9', margin: 0 }}>{h.title}</h4>
                </div>
                <StatusBadge status={isDone ? 'SUBMITTED' : h.status} />
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>📚 {h.subject} &nbsp;•&nbsp; 👤 {h.teacher}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px', lineHeight: 1.4 }}>{h.description?.slice(0, 80)}{h.description?.length > 80 ? '...' : ''}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: isUrgent ? RED : '#64748b' }}>📅 Due {new Date(h.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {isDone ? (
                  h.grade && <span style={{ fontSize: '12px', fontWeight: 800, color: GREEN }}>Grade: {h.grade}</span>
                ) : (
                  <button onClick={() => setSubmitModal(h)} style={{ background: BLUE, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    Submit
                  </button>
                )}
              </div>
              {h.remarks && (
                <div style={{ marginTop: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: GREEN }}>
                  💬 Teacher: &quot;{h.remarks}&quot;
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: SURFACE, borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 900, fontSize: '18px', color: '#f1f5f9', marginBottom: '4px' }}>{submitModal.title}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{submitModal.subject}</p>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Your answer / notes (optional)</label>
            <textarea value={submitText} onChange={e => setSubmitText(e.target.value)}
              style={{ width: '100%', minHeight: '120px', background: SURFACE2, border: '1px solid #2a3a55', borderRadius: '12px', color: '#f1f5f9', padding: '12px', fontSize: '14px', resize: 'vertical' }}
              placeholder="Write your answer or notes here..." />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setSubmitModal(null)} style={{ flex: 1, background: SURFACE2, border: 'none', borderRadius: '10px', padding: '12px', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!!submitting} style={{ flex: 2, background: BLUE, border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '14px', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : '✓ Submit Homework'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

/* ═══════════════════════════════════════════
   ATTENDANCE TAB
═══════════════════════════════════════════ */
function AttendanceTab() {
  const [view, setView] = useState('Monthly');
  const viewKey = view === 'Monthly' ? 'monthly' : view === 'Subject-wise' ? 'subject' : 'period';
  const { data, loading } = useApi<{ view: string; data: unknown[] }>(`/api/student/attendance?view=${viewKey}`, [viewKey]);

  const pct = (p: number, t: number) => (t > 0 ? Math.round((p / t) * 100) : 0);
  const pctColor = (p: number) => p >= 75 ? GREEN : p >= 60 ? YELLOW : RED;

  return (
    <PageWrap>
      <PageTitle>My Attendance</PageTitle>
      <SubTab tabs={['Monthly', 'Subject-wise', 'Period-wise']} active={view} setActive={setView} />

      {loading ? <Loader /> : !data ? null : (

        view === 'Monthly' ? (
          ((data.data ?? []) as Array<{ month: string; label: string; present: number; absent: number; late: number; total: number; percent: number }>)
            .length === 0
            ? <Empty icon="calendar_today" text="No records yet" />
            : ((data.data ?? []) as Array<{ month: string; label: string; present: number; absent: number; late: number; total: number; percent: number }>).map(m => (
              <Card key={m.month}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9', margin: 0 }}>{m.label}</h4>
                  <span style={{ fontWeight: 900, fontSize: '20px', color: pctColor(m.percent) }}>{m.percent}%</span>
                </div>
                <div style={{ background: '#0a0f1e', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${m.percent}%`, background: pctColor(m.percent), borderRadius: '8px', transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <span style={{ color: GREEN }}>✓ Present: {m.present}</span>
                  <span style={{ color: RED }}>✗ Absent: {m.absent}</span>
                  {m.late > 0 && <span style={{ color: YELLOW }}>⏰ Late: {m.late}</span>}
                </div>
              </Card>
            ))
        ) : view === 'Subject-wise' ? (
          ((data.data ?? []) as Array<{ name: string; present: number; absent: number; total: number; percent: number }>)
            .length === 0
            ? <Empty icon="book" text="No records yet" />
            : ((data.data ?? []) as Array<{ name: string; present: number; absent: number; total: number; percent: number }>).map((s, idx) => (
              <Card key={`${s.name}-${idx}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9', margin: 0 }}>{s.name}</h4>
                  <span style={{ fontWeight: 900, fontSize: '18px', color: pctColor(s.percent) }}>{s.percent}%</span>
                </div>
                <div style={{ background: '#0a0f1e', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${s.percent}%`, background: pctColor(s.percent), borderRadius: '8px' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {s.present}/{s.total} classes attended &nbsp;• {s.absent} absences
                  {s.percent < 75 && <span style={{ color: RED, marginLeft: '8px', fontWeight: 700 }}>⚠ Below 75%</span>}
                </div>
              </Card>
            ))
        ) : (
          // Period-wise
          (() => {
            const periodData = (data.data ?? []) as Array<{ id: string; date: string; subject: string; startTime: string; status: string; remarks?: string | null }>;
            if (periodData.length === 0) return <Empty icon="schedule" text="No records yet" />;
            
            // Group by date
            const grouped: Record<string, typeof periodData> = {};
            for (const p of periodData) {
              const d = new Date(p.date);
              const dateStr = `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
              if (!grouped[dateStr]) grouped[dateStr] = [];
              grouped[dateStr].push(p);
            }
            
            const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            
            const getStatusCell = (status: string | undefined, idx: number) => {
              const baseStyle = { padding: '14px 4px', textAlign: 'center' as const, fontWeight: 900, border: '1px solid #1a2438', color: 'white' };
              if (!status) return <td key={idx} style={{ ...baseStyle, background: '#94a3b8', color: '#f1f5f9' }}>-</td>;
              if (status === 'PRESENT') return <td key={idx} style={{ ...baseStyle, background: GREEN }}>P</td>;
              if (status === 'ABSENT') return <td key={idx} style={{ ...baseStyle, background: RED }}>A</td>;
              if (status === 'LATE') return <td key={idx} style={{ ...baseStyle, background: YELLOW }}>L</td>;
              return <td key={idx} style={{ ...baseStyle, background: BLUE }}>{status.charAt(0)}</td>;
            };

            return (
              <div style={{ background: SURFACE2, borderRadius: '14px', overflow: 'hidden', border: '1px solid #2a3a55' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '350px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#2a3a55', color: '#f1f5f9' }}>
                        <th style={{ padding: '14px', textAlign: 'left', fontWeight: 700, border: '1px solid #1a2438', width: '25%' }}>Date</th>
                        {Array.from({ length: 7 }).map((_, i) => (
                          <th key={i} style={{ padding: '14px 4px', textAlign: 'center', fontWeight: 700, border: '1px solid #1a2438' }}>P{i+1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDates.map((date, rIdx) => {
                        const dayPeriods = grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
                        const cells = [];
                        for(let i = 0; i < 7; i++) {
                           cells.push(getStatusCell(dayPeriods[i]?.status, i));
                        }
                        return (
                          <tr key={date} style={{ background: rIdx % 2 === 0 ? SURFACE2 : SURFACE }}>
                            <td style={{ padding: '12px 14px', border: '1px solid #1a2438', color: '#94a3b8', wordBreak: 'break-word', lineHeight: 1.4 }}>
                              {date.replace(/-/g, '-\n')}
                            </td>
                            {cells}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        )
      )}
    </PageWrap>
  );
}

/* ═══════════════════════════════════════════
   SCHEDULE TAB
═══════════════════════════════════════════ */
function ScheduleTab() {
  const [activeDay, setActiveDay] = useState(new Date().getDay() || 1);
  const { data, loading } = useApi<DashboardData['timetable']>(`/api/student/schedule?day=${activeDay}`, [activeDay]);

  return (
    <PageWrap>
      <PageTitle>Time Table</PageTitle>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {WEEK_DAYS.map(d => (
          <button key={d} onClick={() => setActiveDay(d)} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: activeDay === d ? BLUE : SURFACE2, color: activeDay === d ? 'white' : '#64748b',
            boxShadow: activeDay === d ? '0 0 12px rgba(59,130,246,0.35)' : 'none',
          }}>{DAYS[d]}</button>
        ))}
      </div>
      {loading ? <Loader /> : !data || data.length === 0 ? (
        <Empty icon="event_available" text={`No classes on ${DAYS[activeDay]}`} />
      ) : (
        data.map((entry, i) => (
          <Card key={entry.id ?? i} style={{ borderLeft: `3px solid ${BLUE}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: BLUE, background: 'rgba(59,130,246,0.15)', padding: '3px 10px', borderRadius: '6px' }}>
                Period {i + 1}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{entry.startTime} – {entry.endTime}</span>
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '16px', color: '#f1f5f9', margin: '0 0 6px' }}>{entry.subject}</h4>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              👤 {entry.teacher}{entry.roomNumber ? `  •  📍 Room ${entry.roomNumber}` : ''}
            </div>
          </Card>
        ))
      )}
    </PageWrap>
  );
}

/* ═══════════════════════════════════════════
   NOTICE BOARD TAB
═══════════════════════════════════════════ */
function NoticeBoardTab({ announcements }: { announcements: DashboardData['announcements'] }) {
  const icons = ['campaign', 'info', 'event', 'warning', 'star'];
  const iconColors = [RED, BLUE, GREEN, YELLOW, '#8b5cf6'];
  return (
    <PageWrap>
      <PageTitle>Notice Board 📋</PageTitle>
      {announcements.length === 0
        ? <Empty icon="notifications_off" text="No notices yet" sub="Check back later for school announcements." />
        : announcements.map((a, i) => (
          <Card key={a.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${iconColors[i % 5]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: iconColors[i % 5], fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>{icons[i % 5]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9', margin: '0 0 6px' }}>{a.title}</h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{a.body}</p>
              <span style={{ fontSize: '11px', color: '#475569', marginTop: '8px', display: 'block' }}>
                {new Date(a.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </Card>
        ))}
    </PageWrap>
  );
}

/* ═══════════════════════════════════════════
   REMARKS TAB
═══════════════════════════════════════════ */
interface RemarkItem {
  id: string; type: 'exam' | 'homework'; subject: string; exam?: string; homework?: string;
  examType?: string; marksObtained?: number | null; maxMarks?: number | null;
  grade?: string | null; remarks?: string | null; teacher: string; date: string;
}

function RemarksTab() {
  const { data, loading } = useApi<RemarkItem[]>('/api/student/remarks');
  const gradeColor: Record<string, string> = { 'A+': GREEN, A: GREEN, B: BLUE, C: YELLOW, D: YELLOW, E: RED, F: RED };

  return (
    <PageWrap>
      <PageTitle>Teacher Remarks 💬</PageTitle>
      {loading ? <Loader /> : !data || data.length === 0 ? (
        <Empty icon="rate_review" text="No remarks yet" sub="Teacher feedback on exams and homework will appear here." />
      ) : (
        data.map(r => (
          <Card key={r.id} style={{ borderLeft: `3px solid ${r.type === 'exam' ? BLUE : GREEN}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: r.type === 'exam' ? BLUE : GREEN, background: r.type === 'exam' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '5px' }}>
                  {r.type === 'exam' ? '📝 EXAM' : '📚 HOMEWORK'}
                </span>
                <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9', margin: '6px 0 2px' }}>
                  {r.type === 'exam' ? r.exam : r.homework}
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{r.subject} &nbsp;•&nbsp; 👤 {r.teacher}</p>
              </div>
              {r.grade && (
                <div style={{ textAlign: 'center', background: `${gradeColor[r.grade] ?? '#64748b'}22`, borderRadius: '10px', padding: '8px 12px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: gradeColor[r.grade] ?? '#64748b' }}>{r.grade}</span>
                </div>
              )}
            </div>
            {r.marksObtained !== null && r.marksObtained !== undefined && r.maxMarks && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Score</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>{r.marksObtained}/{r.maxMarks}</span>
                </div>
                <div style={{ background: '#0a0f1e', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(r.marksObtained / r.maxMarks) * 100}%`, background: r.marksObtained / r.maxMarks >= 0.75 ? GREEN : YELLOW, borderRadius: '6px' }} />
                </div>
              </div>
            )}
            {r.remarks && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.5 }}>
                &ldquo;{r.remarks}&rdquo;
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
              {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </Card>
        ))
      )}
    </PageWrap>
  );
}

/* ═══════════════════════════════════════════
   PROFILE TAB
═══════════════════════════════════════════ */
function ProfileTab({ data }: { data: DashboardData }) {
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [showPwdSuccess, setShowPwdSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(data.profile.avatarUrl ?? null);
  const [uploadDoing, setUploadDoing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please choose a file under 5MB.');
      return;
    }
    setUploadDoing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // 1. Upload file to our Next.js API, which then uploads it to ImageKit.
      // This bypasses the need for CORS constraints on the storage bucket.
      const uploadRes = await fetch('/api/upload/imagekit', {
        method: 'POST',
        body: formData,
      });

      const resData = await uploadRes.json();
      if (!uploadRes.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to upload file to backend storage');
      }

      // 2. Save public URL mapped to the profile
      const saveRes = await fetch('/api/student/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: resData.publicUrl })
      });

      if (!saveRes.ok) throw new Error('Failed to update profile');

      setAvatarUrl(resData.publicUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadDoing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function removePhoto() {
    try {
      setUploadDoing(true);
      const saveRes = await fetch('/api/student/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null })
      });
      if (saveRes.ok) {
        setAvatarUrl(null);
      } else {
        throw new Error('Failed to remove photo');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo');
    } finally {
      setUploadDoing(false);
    }
  }

  const initial = data.profile.name?.charAt(0) ?? 'S';

  const settings = [
    { icon: 'account_circle', label: 'Full Name', value: data.profile.name },
    { icon: 'badge', label: 'Student ID', value: data.profile.studentId ?? 'N/A' },
    { icon: 'school', label: 'Class', value: `Class ${data.profile.class ?? 'N/A'} — Section ${data.profile.section ?? 'N/A'}` },
    { icon: 'bar_chart_4_bars', label: 'Attendance', value: `${data.attendance.percent}%`, color: data.attendance.percent >= 75 ? GREEN : RED },
  ];

  return (
    <PageWrap>
      <PageTitle>My Profile</PageTitle>

      {/* ── Avatar ── */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Avatar circle */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              style={{
                width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                border: '3px solid rgba(59,130,246,0.6)',
                boxShadow: '0 0 24px rgba(59,130,246,0.35)',
                display: 'block', margin: '0 auto',
              }}
            />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', fontWeight: 900, color: 'white',
              border: '3px solid rgba(59,130,246,0.5)', margin: '0 auto',
              boxShadow: '0 0 24px rgba(59,130,246,0.3)',
            }}>{initial}</div>
          )}

          {/* Camera edit button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDoing}
            style={{
              position: 'absolute', bottom: 0, right: -6, width: 34, height: 34,
              borderRadius: '50%', background: BLUE, border: '2px solid #0a0f1e',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'white', fontVariationSettings: "'FILL' 1" }}>
              {uploadDoing ? 'progress_activity' : 'photo_camera'}
            </span>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <h3 style={{ fontWeight: 900, fontSize: '20px', color: '#f1f5f9', margin: '12px 0 2px' }}>{data.profile.name}</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>{data.profile.studentId}</p>

        {/* Upload controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: BLUE, color: 'white', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}>upload</span>
            {avatarUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          {avatarUrl && (
            <button
              onClick={removePhoto}
              style={{ background: 'rgba(239,68,68,0.15)', color: RED, border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Remove
            </button>
          )}
        </div>

        {/* Success toast */}
        {uploadSuccess && (
          <div style={{ marginTop: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: GREEN, fontWeight: 700, display: 'inline-block' }}>
            ✓ Profile photo updated!
          </div>
        )}

        <p style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>JPG, PNG, WEBP — max 5 MB</p>
      </div>

      {/* ── Info ── */}
      <div style={{ background: SURFACE2, borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
        {settings.map((item, i) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < settings.length - 1 ? '1px solid #0a0f1e' : 'none', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: BLUE, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: (item as { color?: string }).color ?? '#f1f5f9' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* ── Account Settings ── */}
      <h3 style={{ fontWeight: 800, fontSize: '15px', color: '#94a3b8', marginBottom: '10px' }}>ACCOUNT SETTINGS</h3>
      <div style={{ background: SURFACE2, borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        {[
          { icon: 'lock_reset', label: 'Change / Forgot Password', color: YELLOW, action: () => setShowForgotPwd(true) },
          { icon: 'download', label: 'Download My Data', color: BLUE, action: () => alert('Data export coming soon!') },
          { icon: 'notifications', label: 'Notification Settings', color: GREEN, action: () => alert('Notifications coming soon!') },
          { icon: 'help_outline', label: 'Help & Support', color: '#8b5cf6', action: () => alert('Contact admin for support.') },
        ].map(u => (
          <button key={u.label} onClick={u.action} style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #0a0f1e', padding: '14px 16px', cursor: 'pointer', gap: '12px', textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ color: u.color, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{u.icon}</span>
            <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{u.label}</span>
            <span style={{ color: '#64748b' }}>›</span>
          </button>
        ))}
      </div>

      <a href="/api/auth/logout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: RED, borderRadius: '14px', padding: '14px', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}>
        🚪 Sign Out
      </a>

      {/* ── Forgot Password Modal ── */}
      {showForgotPwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: SURFACE, borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%' }}>
            <h3 style={{ fontWeight: 900, fontSize: '18px', color: '#f1f5f9', marginBottom: '4px' }}>Reset Password</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Enter a new password below, or contact your school admin for an official reset.</p>
            {showPwdSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px', color: GREEN }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>check_circle</span>
                <p style={{ fontWeight: 700, marginTop: '8px' }}>Password updated!</p>
              </div>
            ) : (
              <>
                <input type="password" placeholder="New password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  style={{ width: '100%', background: SURFACE2, border: '1px solid #2a3a55', borderRadius: '10px', color: '#f1f5f9', padding: '12px 14px', fontSize: '14px', marginBottom: '12px' }} />
                <div style={{ fontSize: '12px', color: '#64748b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                  ⚠️ For official resets, contact your school administrator.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowForgotPwd(false)} style={{ flex: 1, background: SURFACE2, border: 'none', borderRadius: '10px', padding: '12px', color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => { setShowPwdSuccess(true); setTimeout(() => { setShowForgotPwd(false); setShowPwdSuccess(false); setNewPwd(''); }, 2000); }} disabled={!newPwd}
                    style={{ flex: 2, background: newPwd ? BLUE : '#2a3a55', border: 'none', borderRadius: '10px', padding: '12px', color: 'white', fontWeight: 800, cursor: newPwd ? 'pointer' : 'default', fontSize: '14px' }}>
                    Update Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageWrap>
  );
}

/* ═══════════════════════════════════════════
   HOME TAB
═══════════════════════════════════════════ */
function MenuItem({ icon, title, sub, onClick, badge }: { icon: string; title: string; sub: string; onClick?: () => void; badge?: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', width: '100%',
      background: SURFACE2, border: 'none', borderRadius: '14px',
      padding: '16px 18px', gap: '16px', cursor: 'pointer',
      transition: 'background 0.2s', marginBottom: '10px', textAlign: 'left',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ color: BLUE, fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{sub}</div>
      </div>
      {badge && <span style={{ fontSize: '11px', fontWeight: 800, background: RED, color: 'white', borderRadius: '10px', padding: '3px 8px' }}>{badge}</span>}
      <span style={{ color: BLUE, fontSize: '20px' }}>›</span>
    </button>
  );
}

function HomeTab({ data, setTab }: { data: DashboardData; setTab: (t: string) => void }) {
  const initial = data.profile.name?.charAt(0) ?? 'S';
  const pendingHw = data.homework.filter(h => h.status !== 'SUBMITTED').length;
  const todayDay = new Date().getDay();

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {data.school?.logoUrl ? (
            <img src={data.school.logoUrl} alt="Logo" style={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px', color: 'white' }}>{data.school?.name.charAt(0) ?? 'S'}</div>
          )}
          <span style={{ fontWeight: 800, fontSize: '18px', color: BLUE }}>{data.school?.name ?? 'Scholar One'}</span>
        </div>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '26px' }}>notifications</span>
        </button>
      </div>

      {/* Profile Card */}
      <div style={{ margin: '12px 16px 20px', background: SURFACE, borderRadius: '20px', border: '2px solid #1d4ed8', boxShadow: '0 0 24px rgba(59,130,246,0.3)', padding: '24px 20px 20px', textAlign: 'center' }}>
        {data.profile.avatarUrl ? (
          <img src={data.profile.avatarUrl} alt="Profile" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb', margin: '0 auto 12px', boxShadow: '0 0 16px rgba(59,130,246,0.4)', display: 'block' }} />
        ) : (
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', fontWeight: 900, color: 'white', border: '3px solid #2563eb', margin: '0 auto 12px', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
            {initial}
          </div>
        )}
        <h2 style={{ fontWeight: 900, fontSize: '20px', color: '#f1f5f9', margin: '0 0 3px' }}>{data.profile.name}</h2>
        <p style={{ color: '#64748b', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '18px' }}>{data.profile.studentId ?? 'STUDENT'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #1e2d42', paddingTop: '14px' }}>
          {[
            { icon: 'school', label: 'CLASS', value: `Class ${data.profile.class ?? 'N/A'}` },
            { icon: 'bar_chart_4_bars', label: 'ATTEND.', value: `${data.attendance.percent}%`, color: data.attendance.percent >= 75 ? GREEN : RED },
            { icon: 'grid_view', label: 'SECTION', value: `Sec: ${data.profile.section ?? 'A'}` },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 30, height: 30, background: 'rgba(59,130,246,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' }}>
                  <span className="material-symbols-outlined" style={{ color: BLUE, fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: item.color ?? '#e2e8f0' }}>{item.value}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, background: '#1e2d42' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Attendance banner */}
      <div style={{ margin: '0 16px 16px', background: data.attendance.percent >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${data.attendance.percent >= 75 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
        <span className="material-symbols-outlined" style={{ color: data.attendance.percent >= 75 ? GREEN : RED, fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>{data.attendance.percent >= 75 ? 'check_circle' : 'warning'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '13px', color: '#f1f5f9' }}>{data.attendance.percent >= 75 ? 'Attendance on track!' : 'Attendance below 75%!'}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{data.attendance.present} of {data.attendance.total} days present</div>
        </div>
      </div>

      {/* Today's timetable preview */}
      {data.timetable.length > 0 && (
        <div style={{ margin: '0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9', margin: 0 }}>{DAYS[todayDay]}&apos;s Classes</h3>
            <button onClick={() => setTab('schedule')} style={{ background: 'transparent', border: 'none', color: BLUE, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>View all →</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {data.timetable.slice(0, 3).map((t, i) => (
              <div key={t.id} style={{ flexShrink: 0, width: '140px', background: i === 0 ? 'rgba(59,130,246,0.18)' : SURFACE2, borderRadius: '12px', padding: '12px', border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.35)' : '#1e2d42'}` }}>
                <div style={{ fontSize: '11px', color: BLUE, fontWeight: 700, marginBottom: '4px' }}>{t.startTime}</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>{t.subject}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{t.teacher}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div style={{ padding: '0 16px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#f1f5f9', marginBottom: '14px' }}>Menu</h3>
        <MenuItem icon="bar_chart_4_bars" title="My Attendance" sub="Month, subject & period wise" onClick={() => setTab('attendance')} />
        <MenuItem icon="assignment" title="Homework" sub="Pending & submission" onClick={() => setTab('homework')} badge={pendingHw > 0 ? String(pendingHw) : undefined} />
        <MenuItem icon="calendar_today" title="Time Table" sub="View class schedule" onClick={() => setTab('schedule')} />
        <MenuItem icon="rate_review" title="Remarks" sub="Teacher feedback & grades" onClick={() => setTab('remarks')} />
        <MenuItem icon="campaign" title="Notice Board" sub={`${data.announcements.length} notices`} onClick={() => setTab('notices')} />
        <MenuItem icon="payments" title="Fee & Payments" sub="Check payment status" onClick={() => {}} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { data, loading, error } = useApi<DashboardData>('/api/student/dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, border: `4px solid ${SURFACE2}`, borderTop: `4px solid ${BLUE}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontWeight: 700 }}>Loading your portal...</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '40px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: RED }}>error_outline</span>
        <h3 style={{ color: RED }}>Session Required</h3>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Please log in to access the student portal.</p>
        <a href="/login" style={{ background: BLUE, color: 'white', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>Go to Login</a>
      </div>
    );
  }

  const NAV = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'homework', icon: 'assignment', label: 'Homework' },
    { key: 'schedule', icon: 'calendar_today', label: 'Schedule' },
    { key: 'profile', icon: 'person', label: 'Profile' },
  ];

  const pendingHw = data.homework.filter(h => h.status !== 'SUBMITTED').length;

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#f1f5f9', position: 'relative' }}>
      {activeTab === 'home' && <HomeTab data={data} setTab={setActiveTab} />}
      {activeTab === 'homework' && <HomeworkTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'schedule' && <ScheduleTab />}
      {activeTab === 'notices' && <NoticeBoardTab announcements={data.announcements} />}
      {activeTab === 'remarks' && <RemarksTab />}
      {activeTab === 'profile' && <ProfileTab data={data} />}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(17,24,39,0.95)', borderTop: '1px solid #1e2d42', display: 'flex', zIndex: 200, backdropFilter: 'blur(16px)' }}>
        {NAV.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === tab.key ? BLUE : '#475569', transition: 'color 0.2s', gap: '3px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', fontVariationSettings: activeTab === tab.key ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
              {tab.key === 'homework' && pendingHw > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -8, background: RED, color: 'white', borderRadius: '8px', fontSize: '9px', fontWeight: 800, padding: '1px 5px', minWidth: '16px', textAlign: 'center' }}>{pendingHw}</span>
              )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>{tab.label.toUpperCase()}</span>
            {activeTab === tab.key && <div style={{ position: 'absolute', bottom: 0, width: 32, height: 2, background: BLUE, borderRadius: '2px' }} />}
          </button>
        ))}
      </nav>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
