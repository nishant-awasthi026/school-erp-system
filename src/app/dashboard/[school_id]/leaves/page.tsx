import db from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function LeavesPage({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const leaveRequests = await db.leaveRequest.findMany({
        where: { teacher: { user: { schoolId: school_id } } },
        include: { teacher: { include: { user: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📅 Leave Management</h1>
                    <p className="page-subtitle">Track and approve staff leave requests</p>
                </div>
            </div>

            <div className="grid-cols-4 mb-6">
                <div className="stat-card">
                    <div>
                        <div className="stat-card-label">Total Requests</div>
                        <div className="stat-card-value">{leaveRequests.length}</div>
                    </div>
                    <div className="stat-card-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>📋</div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-label">Pending</div>
                        <div className="stat-card-value text-warning">
                            {leaveRequests.filter(r => r.status === 'PENDING').length}
                        </div>
                    </div>
                    <div className="stat-card-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>⏳</div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th>Type</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.length === 0 ? (
                            <tr><td colSpan={7} className="text-center" style={{ padding: '3rem' }}>No leave requests found</td></tr>
                        ) : leaveRequests.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <div className="font-semibold">{r.teacher.user.name}</div>
                                    <div className="text-xs text-muted">Teacher</div>
                                </td>
                                <td><span className="badge badge-gray">{r.leaveType}</span></td>
                                <td>{new Date(r.fromDate).toLocaleDateString()}</td>
                                <td>{new Date(r.toDate).toLocaleDateString()}</td>
                                <td style={{ maxWidth: '200px' }} className="truncate" title={r.reason}>{r.reason}</td>
                                <td>
                                    <span className={`badge ${
                                        r.status === 'APPROVED' ? 'badge-green' : 
                                        r.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'
                                    }`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td>
                                    {r.status === 'PENDING' ? (
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-success">Approve</button>
                                            <button className="btn btn-sm btn-danger">Reject</button>
                                        </div>
                                    ) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
