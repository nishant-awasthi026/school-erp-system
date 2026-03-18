import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { addEmployee } from '@/app/actions/employee';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

export default async function AddEmployeePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    async function handleAddEmployee(formData: FormData) {
        'use server';
        await addEmployee(school_id, formData);
        redirect(`/dashboard/${school_id}/employees`);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Add New Employee
            </h1>

            <div className="card">
                <form action={handleAddEmployee}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="name">Full Name *</label>
                            <input id="name" name="name" type="text" className="input-field" required />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email (Optional)</label>
                            <input id="email" name="email" type="email" className="input-field" placeholder="Auto-generated if left blank" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="role">Role *</label>
                            <select id="role" name="role" className="input-field" required>
                                <option value="">Select Role</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="designation">Designation</label>
                            <input id="designation" name="designation" type="text" className="input-field" placeholder="e.g., Math Teacher, Librarian" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="qualification">Qualification</label>
                            <input id="qualification" name="qualification" type="text" className="input-field" placeholder="e.g., M.Sc, B.Ed" />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="salary">Salary</label>
                            <input id="salary" name="salary" type="number" className="input-field" placeholder="Monthly salary" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <a
                            href={`/dashboard/${school_id}/employees`}
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
                            Add Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
