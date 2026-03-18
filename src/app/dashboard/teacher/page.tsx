import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

async function getTeacherData(userId: string) {
    const profile = await db.teacherProfile.findUnique({
        where: { userId },
        include: {
            assignedClasses: { include: { _count: { select: { students: true } } } },
            subjects: true,
        },
    });
    if (!profile) return { profile: null, todayTimetable: [], pendingHomework: [], notifications: [] };

    const today = new Date().getDay(); // 0=Sun..6=Sat
    const [todayTimetable, pendingHomework, notifications] = await Promise.all([
        db.timetable.findMany({
            where: { teacherId: profile.id, dayOfWeek: today },
            include: { class: true, section: true, subject: true },
            orderBy: { startTime: 'asc' },
        }),
        db.homework.findMany({
            where: { teacherId: profile.id },
            include: { class: true, subject: true, _count: { select: { submissions: true } } },
            orderBy: { dueDate: 'asc' },
            take: 5,
        }),
        db.teacherNotification.findMany({
            where: { teacherId: profile.id, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
    ]);
    return { profile, todayTimetable, pendingHomework, notifications };
}

export default async function TeacherDashboard() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { profile, todayTimetable, pendingHomework, notifications } = await getTeacherData(user.userId);

    const totalStudents = profile?.assignedClasses.reduce((s: number, c: any) => s + c._count.students, 0) || 0;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">{days[new Date().getDay()]} · {profile?.designation || 'Teacher'} · {profile?.department || ''}</p>
                </div>
                <Link href="/dashboard/teacher/attendance" className="btn btn-primary">📋 Mark Attendance</Link>
            </div>

            {/* Stats */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'My Classes', value: profile?.assignedClasses.length || 0, icon: '🏫', color: 'var(--primary)', bg: 'var(--primary-light)' },
                    { label: 'My Subjects', value: profile?.subjects.length || 0, icon: '📚', color: 'var(--info)', bg: 'var(--info-light)' },
                    { label: 'Total Students', value: totalStudents, icon: '🎓', color: 'var(--success)', bg: 'var(--success-light)' },
                    { label: 'Notifications', value: notifications.length, icon: '🔔', color: notifications.length > 0 ? 'var(--warning)' : 'var(--text-muted)', bg: notifications.length > 0 ? 'var(--warning-light)' : 'var(--surface-2)' },
                ].map(c => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                        <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                        <div className="stat-card-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
                {/* Today's Timetable */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📅 Today&apos;s Schedule</h2>
                        <Link href="/dashboard/teacher/timetable" className="btn btn-ghost btn-sm">Full View</Link>
                    </div>
                    {todayTimetable.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">☀️</div>
                            <div className="empty-state-title">No classes today</div>
                            <div className="empty-state-desc">Enjoy your free day!</div>
                        </div>
                    ) : todayTimetable.map((t: any) => (
                        <div key={t.id} style={{ display: 'flex', gap: '1rem', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', marginBottom: '0.625rem', border: '1px solid var(--border)' }}>
                            <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>{t.startTime}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.endTime}</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.subject.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Class {t.class.name}{t.section ? ` - ${t.section.name}` : ''} {t.roomNumber ? `· ${t.roomNumber}` : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending Homework */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📝 Active Homework</h2>
                        <Link href="/dashboard/teacher/homework" className="btn btn-ghost btn-sm">Manage</Link>
                    </div>
                    {pendingHomework.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <div className="empty-state-title">No homework assigned</div>
                            <Link href="/dashboard/teacher/homework/create" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Create Homework</Link>
                        </div>
                    ) : pendingHomework.map((hw: any) => {
                        const dueDate = new Date(hw.dueDate);
                        const isOverdue = dueDate < new Date();
                        return (
                            <div key={hw.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', marginBottom: '0.625rem', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hw.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Class {hw.class.name} · {hw.subject.name}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: '0.6875rem' }}>
                                        {isOverdue ? 'Overdue' : dueDate.toLocaleDateString()}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {hw._count.submissions} submitted
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>⚡ Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '0.75rem' }}>
                    {[
                        { href: '/dashboard/teacher/attendance', icon: '✅', label: 'Mark Attendance', color: 'var(--success)', bg: 'var(--success-light)' },
                        { href: '/dashboard/teacher/homework/create', icon: '📝', label: 'Assign Homework', color: 'var(--primary)', bg: 'var(--primary-light)' },
                        { href: '/dashboard/teacher/marks', icon: '🏆', label: 'Enter Marks', color: 'var(--warning)', bg: 'var(--warning-light)' },
                        { href: '/dashboard/teacher/lesson-plans', icon: '📖', label: 'Lesson Plans', color: 'var(--info)', bg: 'var(--info-light)' },
                        { href: '/dashboard/teacher/leaves', icon: '🗓️', label: 'Apply Leave', color: 'var(--purple)', bg: 'var(--purple-light)' },
                        { href: '/dashboard/teacher/students', icon: '🎓', label: 'My Students', color: 'var(--info)', bg: 'var(--info-light)' },
                    ].map(a => (
                        <Link key={a.href} href={a.href}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0.75rem', background: a.bg, borderRadius: 'var(--radius-lg)', border: `1px solid ${a.color}22`, textDecoration: 'none', transition: 'all 0.15s', textAlign: 'center' }}
                            className="card-hover">
                            <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: a.color }}>{a.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
