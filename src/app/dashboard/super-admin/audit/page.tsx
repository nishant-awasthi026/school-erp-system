import db from '@/lib/db';

async function getAuditLogs() {
    return db.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { school: { select: { name: true } } },
    });
}

export default async function AuditLogPage() {
    const logs = await getAuditLogs();

    const actionColors: Record<string, string> = {
        CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
        SUSPEND: 'badge-red', LOGIN: 'badge-purple', LOGOUT: 'badge-gray',
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📋 Audit Log</h1>
                    <p className="page-subtitle">Immutable record of all platform actions — {logs.length} entries</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>School</th>
                            <th>Performed By</th>
                            <th>Target</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No audit entries yet</td></tr>
                        ) : logs.map((log) => {
                            const [actionType] = log.action.split(':');
                            const colorClass = actionColors[actionType] || 'badge-gray';
                            return (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span className={`badge ${colorClass}`}>{actionType}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.action.replace(`${actionType}:`, '')}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem' }}>{log.school.name}</td>
                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{log.performedBy.substring(0, 8)}…</td>
                                    <td><span className="badge badge-gray">{log.targetType || '—'}</span></td>
                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
