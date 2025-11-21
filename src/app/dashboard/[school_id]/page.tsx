import db from '@/lib/db';

async function getSchoolStats(schoolId: string) {
    const studentCount = await db.user.count({
        where: { schoolId, role: 'STUDENT' },
    });
    const teacherCount = await db.user.count({
        where: { schoolId, role: 'TEACHER' },
    });
    return { studentCount, teacherCount };
}

export default async function SchoolAdminDashboard({ params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    const stats = await getSchoolStats(school_id);

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                School Dashboard
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {/* Stat Card 1 */}
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Total Students
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {stats.studentCount}
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Total Teachers
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {stats.teacherCount}
                    </div>
                </div>
            </div>
        </div>
    );
}
