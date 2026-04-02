import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function handleLeaveAction(formData: FormData) {
    'use server';
    const leaveId = formData.get('leaveId') as string;
    const status  = formData.get('status') as string;
    const adminNote = formData.get('adminNote') as string;

    await db.leaveRequest.update({
        where: { id: leaveId },
        data: {
            status,
            adminNote: adminNote || null,
            approvedAt: new Date(),
        },
    });
    redirect(require('next/headers').headers().get('referer') || '/');
}

export default async function AdminLeavesPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const pendingLeaves = await db.leaveRequest.findMany({
        where: {
            status: 'PENDING',
            teacher: { user: { schoolId: school_id } },
        },
        include: {
            teacher: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'asc' },
    });

    const allLeaves = await db.leaveRequest.findMany({
        where: { teacher: { user: { schoolId: school_id } } },
        include: {
            teacher: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const statusBadge: Record<string, string> = { PENDING: 'badge-yellow', APPROVED: 'badge-green', REJECTED: 'badge-red' };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🗓️ Leave Requests</h1>
                    <p className="page-subtitle">{pendingLeaves.length} pending · {allLeaves.length} total</p>
                </div>
                <a href={`/dashboard/${school_id}/employees`} className="btn btn-ghost">← Employees</a>
            </div>

            {pendingLeaves.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--warning)' }}>⏳ Pending Approvals</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(pendingLeaves as any[]).map(leave => {
                            const days = Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            return (
                                <div key={leave.id} className="card" style={{ border: '1px solid rgba(234,179,8,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{leave.teacher.user.name}</div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                {leave.leaveType} · {new Date(leave.fromDate).toLocaleDateString()} – {new Date(leave.toDate).toLocaleDateString()} · {days} day{days !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <span className="badge badge-yellow">PENDING</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                        {leave.reason}
                                    </div>
                                    <form action={handleLeaveAction} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input type="hidden" name="leaveId" value={leave.id} />
                                        <input name="adminNote" type="text" className="input-field" placeholder="Admin note (optional)"
                                            style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem' }} />
                                        <button type="submit" name="status" value="APPROVED" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                            ✅ Approve
                                        </button>
                                        <button type="submit" name="status" value="REJECTED" className="btn btn-ghost" style={{ padding: '0.5rem 1rem', color: 'var(--error)' }}>
                                            ❌ Reject
                                        </button>
                                    </form>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* All Leave History */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>📋 All Leave History</div>
                <table className="data-table">
                    <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
                    <tbody>
                        {allLeaves.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No leave requests yet</td></tr>
                        ) : (allLeaves as any[]).map(leave => {
                            const days = Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            return (
                                <tr key={leave.id}>
                                    <td style={{ fontWeight: 500 }}>{leave.teacher.user.name}</td>
                                    <td><span className="badge badge-blue">{leave.leaveType}</span></td>
                                    <td>{new Date(leave.fromDate).toLocaleDateString()}</td>
                                    <td>{new Date(leave.toDate).toLocaleDateString()}</td>
                                    <td>{days}</td>
                                    <td><span className={`badge ${statusBadge[leave.status] || 'badge-gray'}`}>{leave.status}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
