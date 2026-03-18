import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

const NAV = [
    { href: '/dashboard/super-admin', icon: '📊', label: 'Dashboard' },
    { href: '/dashboard/super-admin/schools', icon: '🏫', label: 'Schools' },
    { href: '/dashboard/super-admin/onboard', icon: '➕', label: 'Onboard School' },
    { href: '/dashboard/super-admin/announcements', icon: '📢', label: 'Announcements' },
    { href: '/dashboard/super-admin/audit', icon: '📋', label: 'Audit Log' },
    { href: '/dashboard/super-admin/health', icon: '🩺', label: 'System Health' },
];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') redirect('/');

    return (
        <div className="portal-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">S</div>
                    <div>
                        <div className="sidebar-brand-text">School ERP</div>
                        <div className="sidebar-brand-sub">Platform Operations</div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Management</div>
                    {NAV.map((item) => (
                        <Link key={item.href} href={item.href} className="nav-link">
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Signed in as
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        {user.name}
                    </div>
                    <a href="/api/auth/logout" className="btn btn-ghost btn-sm" style={{ width: '100%' }}>Sign Out</a>
                </div>
            </aside>
            {/* Main */}
            <div className="main-content">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Super Admin</span>
                        <span style={{ color: 'var(--border)' }}>›</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Platform Operations</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Systems Operational</span>
                    </div>
                </header>
                <main className="page-content">{children}</main>
            </div>
        </div>
    );
}
