'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    schoolId: string;
}

function NavLink({ href, children, schoolId }: NavLinkProps) {
    const pathname = usePathname();

    // Special handling for dashboard to only match exact path
    const isDashboardLink = href === `/dashboard/${schoolId}`;
    const isActive = isDashboardLink
        ? pathname === href
        : pathname === href || pathname?.startsWith(href + '/');

    return (
        <Link
            href={href}
            style={{
                display: 'block',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.2s',
            }}
        >
            {children}
        </Link>
    );
}

interface SchoolNavProps {
    schoolId: string;
    schoolName: string;
}

export default function SchoolNav({ schoolId, schoolName }: SchoolNavProps) {
    return (
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
            <div style={{ marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                {schoolName}
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}`} schoolId={schoolId}>
                            📊 Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/classes`} schoolId={schoolId}>
                            📚 Classes
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/students`} schoolId={schoolId}>
                            👨‍🎓 Students
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/employees`} schoolId={schoolId}>
                            👨‍🏫 Employees
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/finance/fee-structure`} schoolId={schoolId}>
                            💵 Fee Structure
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/cashier`} schoolId={schoolId}>
                            💰 Cashier
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/finance`} schoolId={schoolId}>
                            📊 Finance Reports
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/notices`} schoolId={schoolId}>
                            📢 Notices
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/exams`} schoolId={schoolId}>
                            📝 Exams
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/library`} schoolId={schoolId}>
                            📚 Library
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/leaves`} schoolId={schoolId}>
                            📅 Leaves
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/transport`} schoolId={schoolId}>
                            🚌 Transport
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/utilities`} schoolId={schoolId}>
                            🛠️ Utilities
                        </NavLink>
                    </li>
                    <li>
                        <NavLink href={`/dashboard/${schoolId}/settings`} schoolId={schoolId}>
                            ⚙️ Settings
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Logged in as Admin</div>
            </div>
        </aside>
    );
}
