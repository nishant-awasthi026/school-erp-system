import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import MobileLayout from '@/components/teacher/mobile/MobileLayout';

const NAV = [
    { href: '/dashboard/super-admin', icon: '📊', label: 'Dashboard', group: 'Management' },
    { href: '/dashboard/super-admin/schools', icon: '🏫', label: 'Schools' },
    { href: '/dashboard/super-admin/onboard', icon: '➕', label: 'Onboard School' },
    { href: '/dashboard/super-admin/announcements', icon: '📢', label: 'Announcements' },
    { href: '/dashboard/super-admin/audit', icon: '📋', label: 'Audit Log' },
    { href: '/dashboard/super-admin/metrics', icon: '📈', label: 'Monitoring' },
    { href: '/dashboard/super-admin/health', icon: '🩺', label: 'System Health' },
];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') redirect('/');

    return (
        <MobileLayout
            nav={NAV}
            brandLetter="S"
            brandColor="linear-gradient(135deg, #3b82f6, #8b5cf6)"
            brandTitle="School ERP"
            brandSub="Platform Operations"
            userEmail={user.email}
            topbarLeft={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Super Admin</span>
                    <span style={{ color: 'var(--border)' }}>›</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Platform Operations</span>
                </div>
            }
            topbarRight={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Systems Operational</span>
                </div>
            }
        >
            {children}
        </MobileLayout>
    );
}
