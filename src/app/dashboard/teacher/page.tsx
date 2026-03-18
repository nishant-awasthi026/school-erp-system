import { getCurrentUser } from '@/lib/auth';
<<<<<<< HEAD
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
=======
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { getTeacherClasses, getTeacherSubjects } from '@/lib/teacherAuth';

export default async function TeacherDashboardPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'TEACHER') {
        redirect('/');
    }

    const teacher = await db.teacherProfile.findUnique({
        where: { userId: user.userId },
        include: {
            user: true,
        },
    });

    if (!teacher) {
        redirect('/');
    }

    const classes = await getTeacherClasses(teacher.id);
    const subjects = await getTeacherSubjects(teacher.id);

    // Get today's timetable
    const today = new Date();
    const dayOfWeek = today.getDay();

    const todaySchedule = await db.timetable.findMany({
        where: {
            teacherId: teacher.id,
            dayOfWeek,
        },
        include: {
            class: true,
            section: true,
            subject: true,
        },
        orderBy: {
            startTime: 'asc',
        },
    });

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Welcome, {teacher.user.name}!
            </h1>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Classes Assigned
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {classes.length}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid var(--success)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Subjects Teaching
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {subjects.length}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Today's Periods
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {todaySchedule.length}
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    📅 Today's Schedule
                </h2>

                {todaySchedule.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <div>No classes scheduled for today!</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem' }}>Time</th>
                                <th style={{ padding: '0.75rem' }}>Class</th>
                                <th style={{ padding: '0.75rem' }}>Subject</th>
                                <th style={{ padding: '0.75rem' }}>Room</th>
                                <th style={{ padding: '0.75rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaySchedule.map((slot: any) => (
                                <tr key={slot.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                        {slot.startTime} - {slot.endTime}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {slot.class.name} {slot.section ? `- ${slot.section.name}` : ''}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{slot.subject.name}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        {slot.roomNumber || 'N/A'}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <a
                                            href={`/dashboard/teacher/attendance/${slot.id}`}
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                                        >
                                            Take Attendance
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📝 Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <a href="/dashboard/teacher/homework/create" className="btn" style={{ textAlign: 'left' }}>
                            + Assign Homework
                        </a>
                        <a href="/dashboard/teacher/marks" className="btn" style={{ textAlign: 'left' }}>
                            + Enter Marks
                        </a>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📚 My Subjects
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {subjects.map((subject: any) => (
                            <span
                                key={subject.id}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                }}
                            >
                                {subject.name}
                            </span>
                        ))}
                    </div>
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
                </div>
            </div>
        </div>
    );
}
