'use client';
import { useEffect, useState } from 'react';

type Announcement = { id: string; title: string; body: string; targetType: string; createdAt: string };

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [form, setForm] = useState({ title: '', body: '', targetType: 'ALL' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetch('/api/super-admin/announcements').then(r => r.json()).then(d => {
            if (d.success) setAnnouncements(d.data);
        });
    }, []);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setSuccess('');
        try {
            const res = await fetch('/api/super-admin/announcements', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
            });
            const d = await res.json();
            if (d.success) {
                setSuccess('Announcement sent!');
                setAnnouncements(prev => [d.data, ...prev]);
                setForm({ title: '', body: '', targetType: 'ALL' });
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">📢 Announcements</h1>
            </div>
            <div className="grid-cols-2">
                <div className="card">
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Send Platform Announcement</h2>
                    {success && <div className="alert alert-success">{success}</div>}
                    <form onSubmit={send}>
                        <div className="input-group"><label className="input-label">Title *</label><input className="input-field" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required placeholder="New Feature Launch" /></div>
                        <div className="input-group"><label className="input-label">Message *</label><textarea className="textarea-field" value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} required rows={5} placeholder="We are pleased to announce..." /></div>
                        <div className="input-group">
                            <label className="input-label">Target Audience</label>
                            <select className="select-field" value={form.targetType} onChange={e => setForm(f=>({...f,targetType:e.target.value}))}>
                                <option value="ALL">All Schools</option>
                                <option value="SCHOOL">Specific School</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Sending...' : '📢 Send Announcement'}</button>
                    </form>
                </div>
                <div className="card">
                    <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Recent Announcements</h2>
                    {announcements.length === 0
                        ? <div className="empty-state"><div className="empty-state-icon">📢</div><div className="empty-state-title">No announcements yet</div></div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {announcements.map(a => (
                                <div key={a.id} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                                        <span className="badge badge-blue">{a.targetType}</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{a.body.substring(0, 100)}...</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}
