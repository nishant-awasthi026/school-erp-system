import db from '@/lib/db';
import Link from 'next/link';

async function getSchools() {
    return db.school.findMany({
        include: {
            _count: { select: { users: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export default async function SchoolsPage() {
    const schools = await getSchools();

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏫 All Schools</h1>
                    <p className="page-subtitle">{schools.length} schools on the platform</p>
                </div>
                <Link href="/dashboard/super-admin/onboard" className="btn btn-primary">➕ Onboard New School</Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>School Name</th>
                            <th>Board</th>
                            <th>Principal</th>
                            <th>Phone</th>
                            <th>Users</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schools.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No schools onboarded yet</td></tr>
                        ) : schools.map((school) => (
                            <tr key={school.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{school.name}</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{school.address}</div>
                                </td>
                                <td><span className="badge badge-blue">{school.board || 'N/A'}</span></td>
                                <td>{school.principalName || '—'}</td>
                                <td>{school.phone || '—'}</td>
                                <td><span className="badge badge-gray">{school._count.users} users</span></td>
                                <td>
                                    <span className={`badge ${school.isActive ? 'badge-green' : 'badge-red'}`}>
                                        {school.isActive ? '● Active' : '● Suspended'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <SuspendButton schoolId={school.id} isActive={school.isActive} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Client component for suspend action
function SuspendButton({ schoolId, isActive }: { schoolId: string; isActive: boolean }) {
    return (
        <form action={`/api/super-admin/schools/${schoolId}/suspend`} method="POST">
            <button
                type="submit"
                className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}`}
            >
                {isActive ? 'Suspend' : 'Activate'}
            </button>
        </form>
    );
}
