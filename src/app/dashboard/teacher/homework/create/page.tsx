'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ClassOption = { id: string; name: string; sections: { id: string; name: string }[] };
type SubjectOption = { id: string; name: string };

export default function CreateHomeworkPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ title: '', description: '', classId: '', sectionId: '', subjectId: '', dueDate: '' });
    const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    useEffect(() => {
        fetch('/api/teacher/classes').then(r => r.json()).then(d => { if (d.success) setClasses(d.data); });
        fetch('/api/teacher/subjects').then(r => r.json()).then(d => { if (d.success) setSubjects(d.data); });
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            const res = await fetch('/api/teacher/homework', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
            });
            const d = await res.json();
            if (!res.ok || !d.success) throw new Error(d.error?.message || 'Failed');
            router.push('/dashboard/teacher/homework');
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); setLoading(false); }
    };

    const sections = classes.find(c => c.id === form.classId)?.sections || [];

    return (
        <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">📝 Assign Homework</h1>
            </div>
            <div className="card">
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={submit}>
                    <div className="input-group"><label className="input-label">Assignment Title *</label><input className="input-field" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Chapter 5 — Practice Exercises" required /></div>
                    <div className="input-group"><label className="input-label">Description / Instructions *</label><textarea className="textarea-field" rows={5} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Solve exercises 1–20 from Chapter 5. Show all working." required /></div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group">
                            <label className="input-label">Class *</label>
                            <select className="select-field" value={form.classId} onChange={e => { update('classId', e.target.value); update('sectionId', ''); }} required>
                                <option value="">— Select Class —</option>
                                {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Section</label>
                            <select className="select-field" value={form.sectionId} onChange={e => update('sectionId', e.target.value)} disabled={!form.classId}>
                                <option value="">All Sections</option>
                                {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group">
                            <label className="input-label">Subject *</label>
                            <select className="select-field" value={form.subjectId} onChange={e => update('subjectId', e.target.value)} required>
                                <option value="">— Select Subject —</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group"><label className="input-label">Due Date *</label><input type="date" className="input-field" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} required /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Assigning...' : '📤 Assign Homework'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
