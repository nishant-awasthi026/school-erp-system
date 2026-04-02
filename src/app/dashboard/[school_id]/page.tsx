import db from '@/lib/db';
import Link from 'next/link';
import AdminCard from '@/components/dashboard/AdminCard';
import { AttendanceChart, FeeStatusChart } from '@/components/dashboard/DashboardCharts';

async function getSchoolStats(schoolId: string) {
    const [studentCount, teacherCount, totalFeesPending, totalFeesCollected, recentPayments, notices, admissionAppsCount] = await Promise.all([
        db.user.count({ where: { schoolId, role: 'STUDENT', studentProfile: { admissionStatus: 'ACTIVE' } } }),
        db.user.count({ where: { schoolId, role: 'TEACHER' } }),
        db.monthlyFee.count({ where: { status: 'PENDING', student: { user: { schoolId } } } }),
        db.payment.aggregate({ _sum: { amount: true } }),
        db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { monthlyFee: { include: { student: { include: { user: { select: { name: true } } } } } } } }),
        db.notice.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 4 }),
        db.user.count({ where: { schoolId, role: 'STUDENT', studentProfile: { admissionStatus: 'APPLIED' } } }),
    ]);
    return { studentCount, teacherCount, totalFeesPending, totalFeesCollected: totalFeesCollected._sum.amount || 0, recentPayments, notices, admissionAppsCount };
}

export default async function SchoolAdminDashboard({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const stats = await getSchoolStats(school_id);
    const school = await db.school.findUnique({ where: { id: school_id } });

    // Fetch actual attendance data replacing dummy static config
    const classes = await db.class.findMany({
        where: { schoolId: school_id },
        select: {
            name: true,
            timetables: {
                select: {
                    attendanceRecords: {
                        select: {
                            entries: {
                                select: { status: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    const attendanceData = classes.map(cls => {
        let total = 0;
        let presentCount = 0;
        cls.timetables.forEach(tt => {
            tt.attendanceRecords.forEach(ar => {
                ar.entries.forEach(entry => {
                    total++;
                    // Any status other than ABSENT assumes some form of present/credited
                    if (entry.status !== 'ABSENT') presentCount++;
                });
            });
        });
        const pct = total === 0 ? 0 : Math.round((presentCount / total) * 100);
        return { name: cls.name, pct, total };
    }).filter(c => c.total > 0).slice(0, 8); // Showing up to 8 active classes to fit aesthetic parity

    // Fallback if no data recorded
    if (attendanceData.length === 0) {
        attendanceData.push({ name: 'No Data Yet', pct: 0, total: 0 });
    }

    const feePieData = [
        { name: 'Collected', value: stats.totalFeesCollected, color: '#10b981' },
        { name: 'Pending', value: stats.totalFeesPending * 5000, color: '#f59e0b' },
    ];

    const cards = [
        { label: 'Enrolled Students', value: stats.studentCount, icon: '🎓', color: '#3170B1', bg: '#EBF2FA', href: `students` },
        { label: 'New Applications', value: stats.admissionAppsCount, icon: '📩', color: '#8b5cf6', bg: '#F5F3FF', href: `admissions` },
        { label: 'Teaching Staff', value: stats.teacherCount, icon: '👨‍🏫', color: '#10b981', bg: '#ECFDF5', href: `employees` },
        { label: 'Pending Fees', value: stats.totalFeesPending, icon: '⚠️', color: '#f59e0b', bg: '#FFFBEB', href: `finance` },
    ];

    return (
        <div className="animate-fade-in" style={{ padding: '0.5rem' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Management Dashboard</h1>
                    <p className="page-subtitle">{school?.name} · Overview</p>
                </div>
                <Link href={`/dashboard/${school_id}/students/add`} className="btn btn-primary">➕ Admit Student</Link>
            </div>

            {/* Stats Summary Area */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {cards.map((c) => (
                    <Link key={c.label} href={`/dashboard/${school_id}/${c.href}`} style={{ textDecoration: 'none' }}>
                        <div className="stat-card" style={{ background: 'white', border: '1px solid #e1eaf2', padding: '1.25rem', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: c.bg, color: c.color, width: '40px', height: '40px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{c.icon}</div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d3748' }}>{c.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 500 }}>{c.label}</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
                <AdminCard title="Student Attendance Overview (%)" icon="📊">
                    <AttendanceChart data={attendanceData} />
                </AdminCard>

                <AdminCard title="Fee Collection Status" icon="⭕">
                    <FeeStatusChart data={feePieData} />
                </AdminCard>
            </div>

            <div className="grid-cols-2" style={{ marginTop: '1.5rem', gap: '1.5rem' }}>
                <AdminCard title="Recent Fee Payments" icon="💳" rightAction={<Link href={`/dashboard/${school_id}/finance`} className="text-sm font-semibold" style={{ color: 'white', opacity: 0.9 }}>View All</Link>}>
                    {stats.recentPayments.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-title">No payments yet</div></div>
                    ) : (
                        <div className="w-full overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Date</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentPayments.map((p: any) => (
                                        <tr key={p.id}>
                                            <td className="font-medium">{p.monthlyFee?.student?.user?.name || 'Student'}</td>
                                            <td className="text-sm text-muted">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                            <td className="font-bold text-right text-success">₹{p.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AdminCard>

                <AdminCard title="Quick Management" icon="⚡">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        {[
                            { href: `admissions`, icon: '📩', label: 'Applications' },
                            { href: `students/add`, icon: '🎓', label: 'Admissions' },
                            { href: `employees`, icon: '👨‍🏫', label: 'Staffing' },
                            { href: `timetable`, icon: '📅', label: 'Timetable' },
                            { href: `exams`, icon: '📝', label: 'Exam Portal' },
                            { href: `finance`, icon: '💰', label: 'Fee Records' },
                        ].map((a) => (
                            <Link key={a.href} href={`/dashboard/${school_id}/${a.href}`}
                                style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', padding: '0.875rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e1eaf2', fontSize: '0.8125rem', fontWeight: 600, color: '#3170B1' }}>
                                <span>{a.icon}</span>{a.label}
                            </Link>
                        ))}
                    </div>
                </AdminCard>
            </div>
        </div>
    );
}
