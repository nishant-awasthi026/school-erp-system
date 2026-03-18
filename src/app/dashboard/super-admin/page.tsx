import db from '@/lib/db';
import Link from 'next/link';

async function getStats() {
    const [totalSchools, activeSchools, totalStudents, totalTeachers, recentLogs] = await Promise.all([
        db.school.count(),
        db.school.count({ where: { isActive: true } }),
        db.user.count({ where: { role: 'STUDENT' } }),
        db.user.count({ where: { role: 'TEACHER' } }),
        db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { school: { select: { name: true } } } }),
    ]);
    return { totalSchools, activeSchools, totalStudents, totalTeachers, recentLogs };
}

export default async function SuperAdminDashboard() {
    const { totalSchools, activeSchools, totalStudents, totalTeachers, recentLogs } = await getStats();

    const cards = [
        { label: 'Total Schools', value: totalSchools, icon: '🏫', color: 'var(--primary)', bg: 'var(--primary-light)' },
        { label: 'Active Schools', value: activeSchools, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
        { label: 'Total Students', value: totalStudents, icon: '🎓', color: 'var(--warning)', bg: 'var(--warning-light)' },
        { label: 'Total Teachers', value: totalTeachers, icon: '👨‍🏫', color: 'var(--purple)', bg: 'var(--purple-light)' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Platform Dashboard</h1>
                    <p className="page-subtitle">Real-time overview of all schools and platform health</p>
                </div>
                <Link href="/dashboard/super-admin/onboard" className="btn btn-primary">➕ Onboard School</Link>
            </div>

            {/* Stats */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {cards.map((c) => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>
                            {c.icon}
                        </div>
                        <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                        <div className="stat-card-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-cols-2">
                {/* Recent Activity */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>📋 Recent Activity</h2>
                        <Link href="/dashboard/super-admin/audit" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {recentLogs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No activity yet</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentLogs.map((log) => (
                                <div key={log.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '1.25rem' }}>🔔</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.action}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {log.school.name} · {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '1.25rem' }}>⚡ Quick Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { href: '/dashboard/super-admin/onboard', icon: '➕', label: 'Onboard New School', desc: 'Create school tenant in 2 minutes' },
                            { href: '/dashboard/super-admin/schools', icon: '🏫', label: 'Manage Schools', desc: 'Suspend, activate, configure schools' },
                            { href: '/dashboard/super-admin/announcements', icon: '📢', label: 'Send Announcement', desc: 'Broadcast to all school admins' },
                            { href: '/dashboard/super-admin/health', icon: '🩺', label: 'System Health', desc: 'Check infrastructure status' },
                        ].map((a) => (
                            <Link key={a.href} href={a.href} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
                                className="card-hover">
                                <div style={{ fontSize: '1.25rem' }}>{a.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{a.label}</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
