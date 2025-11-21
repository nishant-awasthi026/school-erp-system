import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';

export default async function TeacherDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || user.role !== 'TEACHER') {
        redirect('/');
    }

    const teacher = await db.teacherProfile.findUnique({
        where: { userId: user.userId },
        include: {
            user: true,
        },
    });

    if (!teacher) {
        redirect('/');
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: '250px',
                    backgroundColor: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Teacher Portal</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {teacher.user.name}
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>
                            <a
                                href="/dashboard/teacher"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📊 Dashboard
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/timetable"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📅 Timetable
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/attendance"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                ✅ Attendance
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/homework"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📝 Homework
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/marks"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                📈 Marks
                            </a>
                        </li>
                        <li>
                            <a
                                href="/dashboard/teacher/students"
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'none',
                                }}
                            >
                                👨‍🎓 Students
                            </a>
                        </li>
                    </ul>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {teacher.designation || 'Teacher'}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--background)' }}>
                {children}
            </main>
        </div>
    );
}
