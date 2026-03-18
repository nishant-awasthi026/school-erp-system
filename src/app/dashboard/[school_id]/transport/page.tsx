import db from '@/lib/db';
import Link from 'next/link';

async function getTransportData(schoolId: string) {
    return db.transportRoute.findMany({
        where: { schoolId },
        include: { vehicle: true, allocations: { include: { student: { include: { user: { select: { name: true } } } } } } },
    });
}

export default async function TransportPage({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const routes = await getTransportData(school_id);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🚌 Transport Management</h1>
                    <p className="page-subtitle">{routes.length} routes configured</p>
                </div>
                <Link href={`/dashboard/${school_id}/transport/add`} className="btn btn-primary">➕ Add Route</Link>
            </div>

            {routes.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <div className="empty-state-icon">🚌</div>
                    <div className="empty-state-title">No transport routes</div>
                    <div className="empty-state-desc">Add your first route to start managing school transport</div>
                    <Link href={`/dashboard/${school_id}/transport/add`} className="btn btn-primary">➕ Add First Route</Link>
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {routes.map((route: any) => {
                        const stops = JSON.parse(route.stops || '[]');
                        return (
                            <div key={route.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{route.name}</div>
                                        {route.vehicle && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            🚌 {route.vehicle.registrationNumber} · Driver: {route.vehicle.driverName} ({route.vehicle.driverPhone})
                                        </div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className="badge badge-blue">{route.allocations.length} students</span>
                                        <span className="badge badge-gray">{stops.length} stops</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {stops.map((stop: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <div style={{ padding: '0.375rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', border: '1px solid var(--border)' }}>
                                                📍 {stop.name} {stop.time ? `· ${stop.time}` : ''}
                                            </div>
                                            {i < stops.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
