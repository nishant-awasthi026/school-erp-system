import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

const NAV = [
    { href: '/dashboard/student', icon: '📊', label: 'Dashboard', group: undefined },
    { href: '/dashboard/student/attendance', icon: '✅', label: 'My Attendance', group: 'Academic' },
    { href: '/dashboard/student/timetable', icon: '📅', label: 'Timetable' },
    { href: '/dashboard/student/homework', icon: '📝', label: 'Homework' },
    { href: '/dashboard/student/results', icon: '🏆', label: 'Results' },
    { href: '/dashboard/student/fees', icon: '💰', label: 'Fee & Payments', group: 'Finance' },
    { href: '/dashboard/student/notices', icon: '📢', label: 'Notices', group: 'Communication' },
    { href: '/dashboard/student/profile', icon: '👤', label: 'My Profile', group: 'Account' },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') redirect('/');

    let prevGroup: string | undefined;

    return (
        <div className="portal-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>S</div>
                    <div>
                        <div className="sidebar-brand-text">Student Portal</div>
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
                        🎓  {user.name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
