import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function handleUpdateSettings(schoolId: string, formData: FormData) {
    'use server';
    const name            = formData.get('name') as string;
    const address         = formData.get('address') as string;
    const phone           = formData.get('phone') as string;
    const board           = formData.get('board') as string;
    const principalName   = formData.get('principalName') as string;
    const udiseCode       = formData.get('udiseCode') as string;
    const academicStart   = formData.get('academicYearStart') as string;
    const academicEnd     = formData.get('academicYearEnd') as string;

    if (!name) throw new Error('School name is required');

    await db.school.update({
        where: { id: schoolId },
        data: {
            name,
            address,
            phone,
            board,
            principalName,
            udiseCode: udiseCode || null,
            academicYearStart: academicStart ? new Date(academicStart) : null,
            academicYearEnd: academicEnd ? new Date(academicEnd) : null,
        },
    });
    redirect(`/dashboard/${schoolId}/settings?saved=1`);
}

export default async function SchoolSettingsPage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const updateSettings = handleUpdateSettings.bind(null, school_id);

    const toDateInput = (d: Date | null) => d ? new Date(d).toISOString().split('T')[0] : '';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">⚙️ School Settings</h1>
                    <p className="page-subtitle">Update school information and academic details</p>
                </div>
                <a href={`/dashboard/${school_id}`} className="btn btn-ghost">← Dashboard</a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '900px' }}>
                <form action={updateSettings} style={{ display: 'contents' }}>
                    {/* Basic Info */}
                    <div className="card">
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🏫 Basic Information</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label className="input-label">School Name *</label>
                                <input name="name" type="text" className="input-field" required defaultValue={school.name} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <textarea name="address" className="input-field" rows={3} defaultValue={school.address || ''}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Phone</label>
                                <input name="phone" type="tel" className="input-field" defaultValue={school.phone || ''} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Board</label>
                                <select name="board" className="input-field" defaultValue={school.board || ''}>
                                    <option value="">— Select —</option>
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="State Board">State Board</option>
                                    <option value="IB">IB</option>
                                    <option value="IGCSE">IGCSE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Admin & Academic */}
                    <div className="card">
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🎓 Academic Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label className="input-label">Principal Name</label>
                                <input name="principalName" type="text" className="input-field" defaultValue={school.principalName || ''} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">UDISE Code</label>
                                <input name="udiseCode" type="text" className="input-field" defaultValue={school.udiseCode || ''}
                                    placeholder="Unique District-school identification number" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Academic Year Start</label>
                                <input name="academicYearStart" type="date" className="input-field"
                                    defaultValue={toDateInput(school.academicYearStart)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Academic Year End</label>
                                <input name="academicYearEnd" type="date" className="input-field"
                                    defaultValue={toDateInput(school.academicYearEnd)} />
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <a href={`/dashboard/${school_id}`}
                                style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)' }}>
                                Cancel
                            </a>
                            <button type="submit" className="btn btn-primary">💾 Save Settings</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
