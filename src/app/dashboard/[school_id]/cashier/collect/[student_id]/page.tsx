import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { getStudentDues } from '@/lib/utils/fee-generator';
import PaymentCollectionForm from './PaymentCollectionForm';

interface PageProps {
    params: Promise<{ school_id: string; student_id: string }>;
}

export default async function CollectPaymentPage({ params }: PageProps) {
    const { school_id, student_id } = await params;

    const student = await db.user.findUnique({
        where: { id: student_id },
        include: {
            studentProfile: {
                include: {
                    class: true,
                    section: true,
                },
            },
        },
    });

    if (!student || student.schoolId !== school_id) {
        notFound();
    }

    const duesData = await getStudentDues(student.studentProfile!.id);

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <a
                    href={`/dashboard/${school_id}/cashier`}
                    style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Back to Search
                </a>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Student Information
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Name</div>
                        <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{student.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Roll Number</div>
                        <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{student.studentProfile?.rollNumber || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Class</div>
                        <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                            {student.studentProfile?.class?.name} - {student.studentProfile?.section?.name}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Parent Phone</div>
                        <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{student.studentProfile?.parentPhone || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <PaymentCollectionForm
                studentId={student_id}
                studentProfileId={student.studentProfile!.id}
                schoolId={school_id}
                dues={duesData.dues}
                totalDue={duesData.totalDue}
            />
        </div>
    );
}
