import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function handleCreateExam(schoolId: string, formData: FormData) {
    'use server';
    const name      = formData.get('name') as string;
    const type      = formData.get('type') as string;
    const classId   = formData.get('classId') as string;
    const subjectId = formData.get('subjectId') as string;
    const maxMarks  = parseFloat(formData.get('maxMarks') as string);
    const date      = formData.get('date') as string;

    if (!name || !type || !classId || !subjectId || !date || isNaN(maxMarks)) {
        throw new Error('All fields are required');
    }

    await db.exam.create({
        data: { name, type, classId, subjectId, maxMarks, date: new Date(date), schoolId },
    });
    redirect(`/dashboard/${schoolId}/exams`);
}

export default async function ExamsPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const [exams, classes, subjects] = await Promise.all([
        db.exam.findMany({
            where: { schoolId: school_id },
            include: {
                class: true,
                subject: true,
                _count: { select: { marks: true } },
            },
            orderBy: { date: 'desc' },
        }),
        db.class.findMany({ where: { schoolId: school_id }, orderBy: { name: 'asc' } }),
        db.subject.findMany({ where: { schoolId: school_id }, orderBy: { name: 'asc' } }),
    ]);

    const createExam = handleCreateExam.bind(null, school_id);
    const typeBadge: Record<string, string> = {
        TEST: 'badge-blue', MID_TERM: 'badge-yellow', FINAL: 'badge-red', ASSIGNMENT: 'badge-green',
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📝 Exam Management</h1>
                    <p className="page-subtitle">{exams.length} exams scheduled</p>
                </div>
                <a href={`/dashboard/${school_id}`} className="btn btn-ghost">← Dashboard</a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Create Exam Form */}
                <div className="card">
                    <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>➕ Schedule Exam</h2>
                    <form action={createExam} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label className="input-label">Exam Name *</label>
                            <input name="name" type="text" className="input-field" required
                                placeholder="e.g., Mid-Term Math, Unit Test 1" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Exam Type *</label>
                            <select name="type" className="input-field" required>
                                <option value="">— Select —</option>
                                <option value="TEST">Unit Test</option>
                                <option value="MID_TERM">Mid Term</option>
                                <option value="FINAL">Final Exam</option>
                                <option value="ASSIGNMENT">Assignment</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Class *</label>
                            <select name="classId" className="input-field" required>
                                <option value="">— Select —</option>
                                {(classes as any[]).map(c => (
                                    <option key={c.id} value={c.id}>Class {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Subject *</label>
                            <select name="subjectId" className="input-field" required>
                                <option value="">— Select —</option>
                                {(subjects as any[]).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Max Marks *</label>
                                <input name="maxMarks" type="number" className="input-field" min="1" required defaultValue="100" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Date *</label>
                                <input name="date" type="date" className="input-field" required />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">📝 Schedule Exam</button>
                    </form>
                </div>

                {/* Exams List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                        📋 All Exams
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Exam</th><th>Type</th><th>Class</th><th>Subject</th><th>Date</th><th>Max</th><th>Entries</th></tr>
                        </thead>
                        <tbody>
                            {exams.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No exams scheduled yet</td></tr>
                            ) : (exams as any[]).map(exam => (
                                <tr key={exam.id}>
                                    <td style={{ fontWeight: 500 }}>{exam.name}</td>
                                    <td><span className={`badge ${typeBadge[exam.type] || 'badge-gray'}`}>{exam.type.replace('_', ' ')}</span></td>
                                    <td>Class {exam.class.name}</td>
                                    <td>{exam.subject.name}</td>
                                    <td style={{ fontSize: '0.8125rem' }}>{new Date(exam.date).toLocaleDateString()}</td>
                                    <td>{exam.maxMarks}</td>
                                    <td>
                                        <span className={`badge ${exam._count.marks > 0 ? 'badge-green' : 'badge-gray'}`}>
                                            {exam._count.marks} marks
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
