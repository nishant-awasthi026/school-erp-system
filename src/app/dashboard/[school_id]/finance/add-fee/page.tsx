import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { addFee } from '@/app/actions/finance';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function getStudents(schoolId: string) {
    return await db.user.findMany({
        where: { schoolId, role: 'STUDENT' },
        include: { studentProfile: true },
        orderBy: { name: 'asc' },
    });
}

export default async function AddFeePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    const students = await getStudents(school_id);

    async function handleAddFee(formData: FormData) {
        'use server';
        await addFee(school_id, formData);
        redirect(`/dashboard/${school_id}/finance`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Create New Fee
            </h1>

            <div className="card">
                <form action={handleAddFee}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="title">Fee Title *</label>
                            <input id="title" name="title" type="text" className="input-field" required placeholder="e.g., Tuition Fee - Term 1" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="amount">Amount (₹) *</label>
                            <input id="amount" name="amount" type="number" className="input-field" required />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="dueDate">Due Date *</label>
                            <input id="dueDate" name="dueDate" type="date" className="input-field" required />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="studentId">Assign to Student (Optional)</label>
                            <select id="studentId" name="studentId" className="input-field">
                                <option value="">All Students</option>
                                {students.map((student: any) => (
                                    <option key={student.id} value={student.studentProfile?.id}>
                                        {student.name} - {student.studentProfile?.rollNumber || 'N/A'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <a
                            href={`/dashboard/${school_id}/finance`}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                display: 'inline-block',
                            }}
                        >
                            Cancel
                        </a>
                        <button type="submit" className="btn btn-primary">
                            Create Fee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
