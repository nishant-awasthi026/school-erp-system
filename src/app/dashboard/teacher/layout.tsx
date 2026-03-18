<<<<<<< HEAD
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

const NAV = [
    { href: '/dashboard/teacher', icon: '📊', label: 'Dashboard', group: undefined },
    { href: '/dashboard/teacher/timetable', icon: '📅', label: 'My Timetable', group: 'Academic' },
    { href: '/dashboard/teacher/attendance', icon: '✅', label: 'Attendance' },
    { href: '/dashboard/teacher/homework', icon: '📝', label: 'Homework' },
    { href: '/dashboard/teacher/marks', icon: '🏆', label: 'Mark Entry' },
    { href: '/dashboard/teacher/lesson-plans', icon: '📖', label: 'Lesson Plans' },
    { href: '/dashboard/teacher/students', icon: '🎓', label: 'My Students' },
    { href: '/dashboard/teacher/notifications', icon: '🔔', label: 'Notifications', group: 'Communication' },
    { href: '/dashboard/teacher/leaves', icon: '🗓️', label: 'Leave Requests', group: 'HR' },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') redirect('/');

    let prevGroup: string | undefined;

    return (
        <div className="portal-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>T</div>
                    <div>
                        <div className="sidebar-brand-text">Teacher Portal</div>
                        <div className="sidebar-brand-sub">{user.name}</div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV.map((item) => {
                        const showGroup = item.group && item.group !== prevGroup;
                        if (item.group) prevGroup = item.group;
                        return (
                            <div key={item.href}>
                                {showGroup && <div className="sidebar-section-label">{item.group}</div>}
                                <Link href={item.href} className="nav-link">
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.label}
                                </Link>
                            </div>
                        );
                    })}
                </nav>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{user.email}</div>
                    <a href="/api/auth/logout" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>Sign Out</a>
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        👋 Hello, {user.name.split(' ')[0]}!
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
=======
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';

export default async function TeacherDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: '250px',
                    backgroundColor: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Teacher Portal</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {teacher.user.name}
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>
                            <a
                                href="/dashboard/teacher"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📊 Dashboard
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/timetable"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📅 Timetable
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/attendance"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                ✅ Attendance
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/homework"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📝 Homework
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/marks"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📈 Marks
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/students"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                👨‍🎓 Students
                            </a>
                        </li>
                    </ul>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {teacher.designation || 'Teacher'}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--background)' }}>
                {children}
            </main>
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
        </div>
    );
}
