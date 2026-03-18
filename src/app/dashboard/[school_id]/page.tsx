import db from '@/lib/db';
<<<<<<< HEAD
import Link from 'next/link';

async function getSchoolStats(schoolId: string) {
    const [studentCount, teacherCount, totalFeesPending, totalFeesCollected, recentPayments, notices] = await Promise.all([
        db.user.count({ where: { schoolId, role: 'STUDENT' } }),
        db.user.count({ where: { schoolId, role: 'TEACHER' } }),
        db.monthlyFee.count({ where: { status: 'PENDING', student: { user: { schoolId } } } }),
        db.payment.aggregate({ _sum: { amount: true } }),
        db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { monthlyFee: { include: { student: { include: { user: { select: { name: true } } } } } } } }),
        db.notice.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 4 }),
    ]);
    return { studentCount, teacherCount, totalFeesPending, totalFeesCollected: totalFeesCollected._sum.amount || 0, recentPayments, notices };
=======

async function getSchoolStats(schoolId: string) {
    const studentCount = await db.user.count({
        where: { schoolId, role: 'STUDENT' },
    });
    const teacherCount = await db.user.count({
        where: { schoolId, role: 'TEACHER' },
    });
    return { studentCount, teacherCount };
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
}

export default async function SchoolAdminDashboard({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const stats = await getSchoolStats(school_id);
<<<<<<< HEAD
    const school = await db.school.findUnique({ where: { id: school_id } });

    const cards = [
        { label: 'Total Students', value: stats.studentCount, icon: '🎓', color: 'var(--primary)', bg: 'var(--primary-light)', href: `students` },
        { label: 'Teaching Staff', value: stats.teacherCount, icon: '👨‍🏫', color: 'var(--success)', bg: 'var(--success-light)', href: `employees` },
        { label: 'Pending Fees', value: stats.totalFeesPending, icon: '⚠️', color: 'var(--warning)', bg: 'var(--warning-light)', href: `finance` },
        { label: 'Fee Collected', value: `₹${stats.totalFeesCollected.toLocaleString()}`, icon: '💰', color: 'var(--success)', bg: 'var(--success-light)', href: `finance` },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back! 👋</h1>
                    <p className="page-subtitle">{school?.name} · {school?.board || 'School Management'}</p>
                </div>
                <Link href={`/dashboard/${school_id}/students/add`} className="btn btn-primary">➕ Admit Student</Link>
            </div>

            {/* Stats */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {cards.map((c) => (
                    <Link key={c.label} href={`/dashboard/${school_id}/${c.href}`} style={{ textDecoration: 'none' }}>
                        <div className="stat-card card-hover">
                            <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                            <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                            <div className="stat-card-label">{c.label}</div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid-cols-2">
                {/* Recent Payments */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>💳 Recent Payments</h2>
                        <Link href={`/dashboard/${school_id}/finance`} className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {stats.recentPayments.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-title">No payments yet</div></div>
                    ) : stats.recentPayments.map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.monthlyFee?.student?.user?.name || 'Student'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString()}</div>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount.toLocaleString()}</div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>⚡ Quick Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {[
                            { href: `students/add`, icon: '🎓', label: 'Admit New Student' },
                            { href: `employees`, icon: '👨‍🏫', label: 'Manage Staff' },
                            { href: `timetable`, icon: '📅', label: 'Build Timetable' },
                            { href: `exams`, icon: '📝', label: 'Manage Exams' },
                            { href: `finance`, icon: '💰', label: 'Fee Management' },
                            { href: `library`, icon: '📚', label: 'Library' },
                        ].map((a) => (
                            <Link key={a.href} href={`/dashboard/${school_id}/${a.href}`}
                                style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s' }}
                                className="card-hover">
                                <span>{a.icon}</span>{a.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notices */}
            {stats.notices.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📢 Recent Notices</h2>
                        <Link href={`/dashboard/${school_id}/notices`} className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
                        {stats.notices.map((n: any) => (
                            <div key={n.id} style={{ padding: '0.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{n.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.audience} · {new Date(n.createdAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
=======

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                School Dashboard
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {/* Stat Card 1 */}
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Total Students
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {stats.studentCount}
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Total Teachers
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {stats.teacherCount}
                    </div>
                </div>
            </div>
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
        </div>
    );
}
