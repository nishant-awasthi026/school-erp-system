'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AdmissionForm() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    
    const [selectedSchool, setSelectedSchool] = useState(schoolId || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        studentName: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        targetClass: '',
        previousSchool: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) { setError('Please select a school first.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, schoolId: selectedSchool })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error?.message || 'Submission failed');
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen p-6">
                <div className="card max-w-md text-center">
                    <div className="text-5xl mb-4">📩</div>
                    <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                    <p className="text-gray-600 mb-6">The school administration will review your application and contact you soon.</p>
                    <button onClick={() => window.location.href = '/'} className="btn btn-primary w-full">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 bg-slate-50">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Online Admission Application</h1>
                    <p className="text-gray-600">Please provide the details below to start the enrollment process.</p>
                </div>
                <div className="card">
                    {error && <div className="alert alert-error mb-6">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!schoolId && (
                            <div className="input-group">
                                <label className="input-label">Select School *</label>
                                <input className="input-field" name="schoolId" value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} placeholder="Enter School ID" />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="input-group">
                                <label className="input-label">Student Full Name *</label>
                                <input required className="input-field" name="studentName" value={form.studentName} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Grade/Class Interested *</label>
                                <input required className="input-field" name="targetClass" value={form.targetClass} onChange={handleChange} placeholder="e.g. 5th Grade" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="input-group">
                                <label className="input-label">Parent/Guardian Name *</label>
                                <input required className="input-field" name="parentName" value={form.parentName} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Parent Phone Number *</label>
                                <input required className="input-field" name="parentPhone" value={form.parentPhone} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Parent Email Address *</label>
                            <input required type="email" className="input-field" name="parentEmail" value={form.parentEmail} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Previous School (if any)</label>
                            <input className="input-field" name="previousSchool" value={form.previousSchool} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Additional Message</label>
                            <textarea className="input-field min-h-[100px]" name="message" value={form.message} onChange={handleChange} />
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-lg">
                            {loading ? 'Submitting Application...' : '🚀 Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default function PublicAdmissionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
            <AdmissionForm />
        </Suspense>
    );
}
