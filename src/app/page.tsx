'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PORTALS = [
    {
        id: 'admin',
        label: 'Super Admin',
        icon: '🛡️',
        demo: { email: 'admin@schoolerp.com', password: 'Admin@123' },
        color: '#8b5cf6',
        description: 'Platform operations & analytics',
    },
    {
        id: 'school',
        label: 'School Admin',
        icon: '🏫',
        demo: { email: 'schooladmin@demo.com', password: 'School@123' },
        color: '#3b82f6',
        description: 'Manage your institution',
    },
    {
        id: 'teacher',
        label: 'Teacher',
        icon: '📚',
        demo: { email: 'teacher@demo.com', password: 'Teacher@123' },
        color: '#10b981',
        description: 'Attendance, grades & homework',
    },
    {
        id: 'student',
        label: 'Student',
        icon: '🎓',
        demo: { email: 'student@demo.com', password: 'Student@123' },
        color: '#f59e0b',
        description: 'Results, fees & timetable',
    },
];

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState('school');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const activePortal = PORTALS.find((p) => p.id === activeTab)!;

    const fillDemo = () => {
        setEmail(activePortal.demo.email);
        setPassword(activePortal.demo.password);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error?.message || 'Login failed');
            }
            router.push(data.data.redirectUrl);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at 60% 20%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.1) 0%, transparent 60%), var(--background)',
            padding: '1.5rem',
        }}>
            {/* Ambient glow orbs */}
            <div style={{ position: 'fixed', top: '10%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '15%', left: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    
                    {/* PROTOTYPE LINKS -- ADDED BY STITCH/REACT-COMPONENTS */}
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <a href="/dashboard/student" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>View New Student Portal</a>
                        <a href="/dashboard/teacher" style={{ padding: '0.5rem 1rem', background: '#8b5cf6', color: 'white', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>View New Teacher Portal</a>
                    </div>
                    
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--primary), var(--purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                    }}>🎓</div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.375rem', background: 'linear-gradient(135deg, var(--text-main), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        School ERP
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Complete School Management Platform</p>
                </div>

                {/* Portal Tabs */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem',
                    marginBottom: '1.5rem', background: 'var(--surface)', padding: '0.375rem',
                    borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
                }}>
                    {PORTALS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => { setActiveTab(p.id); setError(''); setEmail(''); setPassword(''); }}
                            style={{
                                padding: '0.625rem 0.25rem',
                                borderRadius: 'var(--radius-lg)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                transition: 'all 0.2s',
                                background: activeTab === p.id ? `${p.color}18` : 'transparent',
                                color: activeTab === p.id ? p.color : 'var(--text-muted)',
                                borderBottom: activeTab === p.id ? `2px solid ${p.color}` : '2px solid transparent',
                                fontWeight: activeTab === p.id ? 600 : 400,
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
                            <span style={{ fontSize: '0.6875rem', lineHeight: 1 }}>{p.label}</span>
                        </button>
                    ))}
                </div>

                {/* Login Card */}
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: '2rem',
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(10px)',
                }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{activePortal.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{activePortal.label} Login</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{activePortal.description}</div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@school.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontSize: '1rem', fontWeight: 600, background: `linear-gradient(135deg, ${activePortal.color}, ${activePortal.color}cc)`, boxShadow: `0 4px 16px ${activePortal.color}33` }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Signing in...' : `Sign in as ${activePortal.label}`}
                        </button>

                        <button type="button" className="btn btn-ghost" style={{ width: '100%', fontSize: '0.875rem' }} onClick={fillDemo}>
                            🔑 Fill Demo Credentials
                        </button>
                    </form>
                </div>

                {/* Demo Note */}
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Demo:</strong>{' '}
                    {activePortal.demo.email} / {activePortal.demo.password}
                </div>
            </div>
        </main>
    );
}
