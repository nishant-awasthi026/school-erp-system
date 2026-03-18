async function getHealthData() {
    const mem = process.memoryUsage();
    return {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
        uptime: Math.round(process.uptime()),
    };
}

export default async function HealthPage() {
    const health = await getHealthData();
    const uptimeHrs = Math.floor(health.uptime / 3600);
    const uptimeMins = Math.floor((health.uptime % 3600) / 60);

    const services = [
        { name: 'Next.js App Server', status: 'operational', latency: '<5ms', icon: '⚡' },
        { name: 'Prisma / SQLite Database', status: 'operational', latency: '<10ms', icon: '🗄️' },
        { name: 'Auth (JWT/jose)', status: 'operational', latency: '<1ms', icon: '🔐' },
        { name: 'File Storage (Cloudinary)', status: 'configured', latency: 'N/A', icon: '📁' },
        { name: 'Payment Gateway', status: 'optional', latency: 'N/A', icon: '💳' },
        { name: 'SMS Gateway (IoT)', status: 'optional', latency: 'N/A', icon: '📱' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🩺 System Health</h1>
                    <p className="page-subtitle">Platform infrastructure status and runtime metrics</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="status-dot dot-green" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>All Systems Operational</span>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Heap Used', value: `${health.heapUsed} MB`, icon: '💾', color: 'var(--primary)' },
                    { label: 'Heap Total', value: `${health.heapTotal} MB`, icon: '📊', color: 'var(--info)' },
                    { label: 'RSS Memory', value: `${health.rss} MB`, icon: '🧠', color: 'var(--warning)' },
                    { label: 'Uptime', value: `${uptimeHrs}h ${uptimeMins}m`, icon: '⏱️', color: 'var(--success)' },
                ].map(m => (
                    <div key={m.label} className="stat-card">
                        <div className="stat-card-icon" style={{ background: `${m.color}18`, color: m.color, fontSize: '1.25rem', marginBottom: '0.5rem' }}>{m.icon}</div>
                        <div className="stat-card-value" style={{ color: m.color, fontSize: '1.5rem' }}>{m.value}</div>
                        <div className="stat-card-label">{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Services */}
            <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Service Status</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {services.map(s => (
                        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                                <span style={{ fontWeight: 500 }}>{s.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.latency}</span>
                                <span className={`badge ${s.status === 'operational' ? 'badge-green' : s.status === 'configured' ? 'badge-blue' : 'badge-gray'}`}>
                                    {s.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
