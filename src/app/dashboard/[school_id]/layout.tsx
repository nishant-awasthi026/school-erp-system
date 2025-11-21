import db from '@/lib/db';
import { notFound } from 'next/navigation';
import SchoolNav from './SchoolNav';

export default async function SchoolDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ school_id: string }>;
}) {
    const { school_id } = await params;
    const school = await db.school.findUnique({
        where: { id: school_id },
    });

    if (!school) {
        notFound();
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <SchoolNav schoolId={school_id} schoolName={school.name} />
            <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--background)' }}>
                {children}
            </main>
        </div>
    );
}
