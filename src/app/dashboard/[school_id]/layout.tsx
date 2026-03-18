import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

const getNav = (id: string) => [
    { href: `/dashboard/${id}`, icon: '📊', label: 'Dashboard' },
    { href: `/dashboard/${id}/students`, icon: '🎓', label: 'Students', group: 'Academic' },
    { href: `/dashboard/${id}/classes`, icon: '🏫', label: 'Classes' },
    { href: `/dashboard/${id}/timetable`, icon: '📅', label: 'Timetable' },
    { href: `/dashboard/${id}/exams`, icon: '📝', label: 'Examinations' },
    { href: `/dashboard/${id}/employees`, icon: '👨‍🏫', label: 'Staff', group: 'HR' },
    { href: `/dashboard/${id}/leaves`, icon: '🗓️', label: 'Leave Requests' },
    { href: `/dashboard/${id}/finance`, icon: '💰', label: 'Finance', group: 'Finance' },
    { href: `/dashboard/${id}/library`, icon: '📚', label: 'Library', group: 'Services' },
    { href: `/dashboard/${id}/transport`, icon: '🚌', label: 'Transport' },
    { href: `/dashboard/${id}/notices`, icon: '📢', label: 'Notices' },
    { href: `/dashboard/${id}/reports`, icon: '📈', label: 'Reports' },
    { href: `/dashboard/${id}/utilities`, icon: '⚙️', label: 'Configuration' },
];

export default async function SchoolDashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ school_id: string }> }) {
    const user = await getCurrentUser();
    const { school_id } = await params;

    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'CASHIER')) {
        redirect('/');
    }

    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const nav = getNav(school_id);
    let prevGroup = '';

    return (
        <div className="portal-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">{school.name[0]}</div>
                    <div>
                        <div className="sidebar-brand-text">{school.name}</div>
                        <div className="sidebar-brand-sub">School Admin</div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {nav.map((item) => {
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
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{user.email}</div>
                    <a href="/api/auth/logout" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>Sign Out</a>
                </div>
            </aside>
            <div className="main-content">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{school.name}</span>
                        <span style={{ color: 'var(--border)' }}>›</span>
                        <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>School Admin</span>
                    </div>
                    <Link href="/dashboard/super-admin" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {school.board && <span className="badge badge-gray">{school.board}</span>}
                    </Link>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
