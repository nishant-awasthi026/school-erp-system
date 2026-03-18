'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Step { id: number; title: string; desc: string; }
const STEPS: Step[] = [
    { id: 1, title: 'School Info', desc: 'Basic details' },
    { id: 2, title: 'Academic Setup', desc: 'Calendar & board' },
    { id: 3, title: 'Admin Account', desc: 'First admin credentials' },
];

export default function OnboardPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState<{email: string; password: string} | null>(null);
    const [form, setForm] = useState({
        name: '', address: '', phone: '', board: 'CBSE', principalName: '', udiseCode: '',
        academicYearStart: '2025-04-01', academicYearEnd: '2026-03-31',
        adminName: '', adminEmail: '',
    });

    const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/super-admin/schools', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to create school');
            setSuccess(data.data.adminCredentials);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error');
        } finally { setLoading(false); }
    };

    if (success) return (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>School Onboarded!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Share these credentials with the school admin:</p>
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <div style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Email:</span> <strong>{success.email}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Password:</span> <strong>{success.password}</strong></div>
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard/super-admin/schools')}>View All Schools</button>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">➕ Onboard New School</h1>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                {STEPS.map((s, i) => (
                    <div key={s.id} style={{ flex: 1, padding: '1rem', textAlign: 'center', background: step === s.id ? 'var(--primary-light)' : 'transparent', borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: step >= s.id ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '0.125rem' }}>Step {s.id}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: step >= s.id ? 'var(--text-main)' : 'var(--text-muted)' }}>{s.title}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

                {step === 1 && <>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>School Information</h3>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">School Name *</label><input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Demo Public School" /></div>
                        <div className="input-group"><label className="input-label">Phone Number</label><input className="input-field" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="9876543210" /></div>
                    </div>
                    <div className="input-group"><label className="input-label">Address</label><input className="input-field" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Education Lane, Mumbai" /></div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Principal Name</label><input className="input-field" value={form.principalName} onChange={e => update('principalName', e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">UDISE Code</label><input className="input-field" value={form.udiseCode} onChange={e => update('udiseCode', e.target.value)} /></div>
                    </div>
                </>}

                {step === 2 && <>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Academic Setup</h3>
                    <div className="input-group">
                        <label className="input-label">Affiliated Board</label>
                        <select className="select-field" value={form.board} onChange={e => update('board', e.target.value)}>
                            {['CBSE','ICSE','State Board - Maharashtra','State Board - UP','State Board - Karnataka','IB','IGCSE'].map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Academic Year Start</label><input type="date" className="input-field" value={form.academicYearStart} onChange={e => update('academicYearStart', e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Academic Year End</label><input type="date" className="input-field" value={form.academicYearEnd} onChange={e => update('academicYearEnd', e.target.value)} /></div>
                    </div>
                </>}

                {step === 3 && <>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>School Admin Account</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>A School Admin account will be created. A temporary password will be generated.</p>
                    <div className="input-group"><label className="input-label">Admin Full Name *</label><input className="input-field" value={form.adminName} onChange={e => update('adminName', e.target.value)} placeholder="School Administrator" /></div>
                    <div className="input-group"><label className="input-label">Admin Email *</label><input type="email" className="input-field" value={form.adminEmail} onChange={e => update('adminEmail', e.target.value)} placeholder="admin@school.com" /></div>
                </>}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <button className="btn btn-ghost" onClick={() => step > 1 && setStep(s => s - 1)} disabled={step === 1}>← Back</button>
                    {step < 3
                        ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !form.name}>Next →</button>
                        : <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.adminName || !form.adminEmail}>{loading ? 'Creating...' : '✅ Create School'}</button>
                    }
                </div>
            </div>
        </div>
    );
}
