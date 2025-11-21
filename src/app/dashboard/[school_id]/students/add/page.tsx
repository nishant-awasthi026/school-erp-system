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
            </div>
        </div>
    );
}
