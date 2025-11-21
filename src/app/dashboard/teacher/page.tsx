import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { getTeacherClasses, getTeacherSubjects } from '@/lib/teacherAuth';

export default async function TeacherDashboardPage() {
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

    const classes = await getTeacherClasses(teacher.id);
    const subjects = await getTeacherSubjects(teacher.id);

    // Get today's timetable
    const today = new Date();
    const dayOfWeek = today.getDay();

    const todaySchedule = await db.timetable.findMany({
        where: {
            teacherId: teacher.id,
            dayOfWeek,
        },
        include: {
            class: true,
            section: true,
            subject: true,
        },
        orderBy: {
            startTime: 'asc',
        },
    });

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Welcome, {teacher.user.name}!
            </h1>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Classes Assigned
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {classes.length}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid var(--success)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Subjects Teaching
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {subjects.length}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Today's Periods
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {todaySchedule.length}
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    📅 Today's Schedule
                </h2>

                {todaySchedule.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <div>No classes scheduled for today!</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem' }}>Time</th>
                                <th style={{ padding: '0.75rem' }}>Class</th>
                                <th style={{ padding: '0.75rem' }}>Subject</th>
                                <th style={{ padding: '0.75rem' }}>Room</th>
                                <th style={{ padding: '0.75rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaySchedule.map((slot: any) => (
                                <tr key={slot.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                        {slot.startTime} - {slot.endTime}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {slot.class.name} {slot.section ? `- ${slot.section.name}` : ''}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{slot.subject.name}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        {slot.roomNumber || 'N/A'}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <a
                                            href={`/dashboard/teacher/attendance/${slot.id}`}
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                                        >
                                            Take Attendance
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📝 Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <a href="/dashboard/teacher/homework/create" className="btn" style={{ textAlign: 'left' }}>
                            + Assign Homework
                        </a>
                        <a href="/dashboard/teacher/marks" className="btn" style={{ textAlign: 'left' }}>
                            + Enter Marks
                        </a>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        📚 My Subjects
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {subjects.map((subject: any) => (
                            <span
                                key={subject.id}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                }}
                            >
                                {subject.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
