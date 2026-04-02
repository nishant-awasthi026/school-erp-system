import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { addFee } from '@/app/actions/finance';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

const MONTHS = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' },    { value: '04', label: 'April' },
    { value: '05', label: 'May' },      { value: '06', label: 'June' },
    { value: '07', label: 'July' },     { value: '08', label: 'August' },
    { value: '09', label: 'September' },{ value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

export default async function AddFeePage({ params }: PageProps) {
    const { school_id } = await params;

    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const classes = await db.class.findMany({
        where: { schoolId: school_id },
        include: {
            feeStructure: true,
            _count: { select: { students: true } },
        },
        orderBy: { name: 'asc' },
    });

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    async function handleAddFee(formData: FormData) {
        'use server';
        // Derive monthName from month value
        const monthVal = formData.get('month') as string;
        const monthNum = parseInt(monthVal);
        const monthNames = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];
        formData.set('monthName', monthNames[monthNum - 1]);
        await addFee(school_id, formData);
        redirect(`/dashboard/${school_id}/finance`);
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💳 Generate Monthly Fees</h1>
                    <p className="page-subtitle">Create fee records for all active students in a class</p>
                </div>
                <a href={`/dashboard/${school_id}/finance`} className="btn btn-ghost">← Back to Finance</a>
            </div>

            <div className="card" style={{ maxWidth: '640px' }}>
                <form action={handleAddFee}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label" htmlFor="classId">Class *</label>
                            <select id="classId" name="classId" className="input-field" required>
                                <option value="">— Select a class —</option>
                                {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        Class {c.name} ({c._count.students} students)
                                        {c.feeStructure ? ` · ₹${c.feeStructure.monthlyAmount}/mo` : ' · ⚠️ No fee structure'}
                                    </option>
                                ))}
                            </select>
                            {classes.every((c: any) => !c.feeStructure) && (
                                <p style={{ color: 'var(--warning)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                                    ⚠️ No classes have a fee structure configured. Set one up in{' '}
                                    <a href={`/dashboard/${school_id}/finance/fee-structure`} style={{ color: 'var(--primary)' }}>Fee Structure</a>.
                                </p>
                            )}
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="monthYear">Year *</label>
                            <input id="year" name="year" type="number" className="input-field"
                                defaultValue={currentYear} min="2020" max="2035" required />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="month">Month *</label>
                            <select id="month" name="month" className="input-field" required>
                                {MONTHS.map(m => (
                                    <option key={m.value} value={m.value} selected={m.value === currentMonth}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label" htmlFor="dueDate">Due Date *</label>
                            <input id="dueDate" name="dueDate" type="date" className="input-field" required />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Fee records will be created for all active students in the selected class.
                                Existing records for the same month are skipped.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <a href={`/dashboard/${school_id}/finance`}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)' }}>
                            Cancel
                        </a>
                        <button type="submit" className="btn btn-primary">
                            💳 Generate Fee Records
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
