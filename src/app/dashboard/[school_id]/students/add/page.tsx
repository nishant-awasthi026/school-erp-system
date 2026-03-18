<<<<<<< HEAD
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ClassOption { id: string; name: string; sections: { id: string; name: string }[] }

export default function AddStudentPage() {
    const { school_id } = useParams<{ school_id: string }>();
    const router = useRouter();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        name: '', email: '', password: '',
        rollNumber: '', studentId: '',
        dob: '', gender: '', category: 'GENERAL', bloodGroup: '', aadhaar: '',
        fatherName: '', motherName: '', guardianPhone: '', address: '',
    });

    useEffect(() => {
        fetch(`/api/schools/${school_id}/classes`).then(r => r.json()).then(d => {
            if (d.success) setClasses(d.data);
        });
    }, [school_id]);

    const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`/api/schools/${school_id}/students`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, classId: selectedClass, sectionId: selectedSection }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed');
            router.push(`/dashboard/${school_id}/students`);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error'); setLoading(false);
        }
    };

    const sections = classes.find(c => c.id === selectedClass)?.sections || [];

    return (
        <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">🎓 Admit New Student</h1>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                {[{id:1,t:'Student Info'},{id:2,t:'Personal Details'},{id:3,t:'Family Info'}].map((s, i, arr) => (
                    <div key={s.id} style={{ flex: 1, padding: '0.875rem', textAlign: 'center', background: step === s.id ? 'var(--primary-light)' : 'transparent', borderRight: i<arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: step >= s.id ? 'var(--primary)' : 'var(--text-muted)' }}>STEP {s.id}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: step >= s.id ? 'var(--text-main)' : 'var(--text-muted)' }}>{s.t}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                {error && <div className="alert alert-error">{error}</div>}

                {step === 1 && <>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Student Information</h3>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Full Name *</label><input className="input-field" value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Priya Patel" /></div>
                        <div className="input-group"><label className="input-label">Student ID</label><input className="input-field" value={form.studentId} onChange={e=>update('studentId',e.target.value)} placeholder="DPS-2025-003" /></div>
                    </div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Login Email *</label><input type="email" className="input-field" value={form.email} onChange={e=>update('email',e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Password *</label><input type="password" className="input-field" value={form.password} onChange={e=>update('password',e.target.value)} placeholder="Min 8 chars" /></div>
                    </div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group">
                            <label className="input-label">Class *</label>
                            <select className="select-field" value={selectedClass} onChange={e=>{setSelectedClass(e.target.value);setSelectedSection('');}}>
                                <option value="">— Select Class —</option>
                                {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Section</label>
                            <select className="select-field" value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} disabled={!selectedClass}>
                                <option value="">— Select Section —</option>
                                {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Roll Number</label><input className="input-field" value={form.rollNumber} onChange={e=>update('rollNumber',e.target.value)} /></div>
                    </div>
                </>}

                {step === 2 && <>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Personal Details</h3>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Date of Birth</label><input type="date" className="input-field" value={form.dob} onChange={e=>update('dob',e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Gender</label>
                            <select className="select-field" value={form.gender} onChange={e=>update('gender',e.target.value)}>
                                <option value="">— Select —</option><option>MALE</option><option>FEMALE</option><option>OTHER</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Category</label>
                            <select className="select-field" value={form.category} onChange={e=>update('category',e.target.value)}>
                                {['GENERAL','OBC','SC','ST','EWS'].map(c=><option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="input-group"><label className="input-label">Blood Group</label>
                            <select className="select-field" value={form.bloodGroup} onChange={e=>update('bloodGroup',e.target.value)}>
                                <option value="">—</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg=><option key={bg}>{bg}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="input-group"><label className="input-label">Aadhaar Number</label><input className="input-field" value={form.aadhaar} onChange={e=>update('aadhaar',e.target.value)} placeholder="12-digit Aadhaar" maxLength={12} /></div>
                    <div className="input-group"><label className="input-label">Address</label><textarea className="textarea-field" rows={3} value={form.address} onChange={e=>update('address',e.target.value)} /></div>
                </>}

                {step === 3 && <>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Family Information</h3>
                    <div className="form-grid form-grid-2">
                        <div className="input-group"><label className="input-label">Father's Name *</label><input className="input-field" value={form.fatherName} onChange={e=>update('fatherName',e.target.value)} /></div>
                        <div className="input-group"><label className="input-label">Mother's Name</label><input className="input-field" value={form.motherName} onChange={e=>update('motherName',e.target.value)} /></div>
                    </div>
                    <div className="input-group"><label className="input-label">Guardian Phone *</label><input className="input-field" value={form.guardianPhone} onChange={e=>update('guardianPhone',e.target.value)} placeholder="10-digit mobile" /></div>
                </>}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <button className="btn btn-ghost" onClick={() => { if (step > 1) setStep(s=>s-1); else router.back(); }}>← Back</button>
                    {step < 3
                        ? <button className="btn btn-primary" onClick={()=>setStep(s=>s+1)} disabled={step===1 && (!form.name||!form.email||!form.password)}>Next →</button>
                        : <button className="btn btn-primary" onClick={handleSubmit} disabled={loading||!form.fatherName||!form.guardianPhone}>{loading?'Saving...':'✅ Admit Student'}</button>
                    }
                </div>
=======
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import AddStudentForm from './AddStudentForm';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function AddStudentPage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Add New Student
            </h1>

            <div className="card">
                <AddStudentForm schoolId={school_id} />
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
            </div>
        </div>
    );
}
