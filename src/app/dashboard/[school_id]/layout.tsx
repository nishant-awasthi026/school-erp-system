import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import MobileLayout from '@/components/teacher/mobile/MobileLayout';

const getNav = (id: string) => [
    { href: `/dashboard/${id}`, icon: '📊', label: 'Dashboard', group: undefined },
    { href: `/dashboard/${id}/students`, icon: '🎓', label: 'Students', group: 'Academic' },
    { href: `/dashboard/${id}/classes`, icon: '🏫', label: 'Classes' },
    { href: `/dashboard/${id}/employees`, icon: '👨‍🏫', label: 'Staff', group: 'HR' },
    { href: `/dashboard/${id}/leaves`, icon: '🗓️', label: 'Leave Requests' },
    { href: `/dashboard/${id}/finance`, icon: '💰', label: 'Finance', group: 'Finance' },
    { href: `/dashboard/${id}/library`, icon: '📚', label: 'Library', group: 'Services' },
    { href: `/dashboard/${id}/transport`, icon: '🚌', label: 'Transport' },
    { href: `/dashboard/${id}/notices`, icon: '📢', label: 'Notices' },
    { href: `/dashboard/${id}/config`, icon: '⚙️', label: 'Configuration' },
];

export default async function SchoolDashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ school_id: string }> }) {
    const user = await getCurrentUser();
    const { school_id } = await params;

    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'CASHIER')) {
        redirect('/');
    }

    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    return (
        <MobileLayout
            theme="srm-theme"
            nav={getNav(school_id)}
            brandLetter={school.name[0]}
            brandColor="linear-gradient(135deg, #3b82f6, #8b5cf6)"
            brandTitle={school.name}
            brandSub="School Admin"
            brandLogo={school.logoUrl || undefined}
            userEmail={user.email}
            topbarLeft={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{school.name}</span>
                    <span style={{ color: 'var(--border)' }}>›</span>
                    <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>School Admin</span>
                </div>
            }
            topbarRight={
                school.board ? (
                    <span className="badge badge-gray">{school.board}</span>
                ) : undefined
            }
        >
            {children}
        </MobileLayout>
    );
}
