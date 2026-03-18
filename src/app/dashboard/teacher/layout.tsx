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
        </div>
    );
}
