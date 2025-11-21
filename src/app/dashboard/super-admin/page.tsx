import db from '@/lib/db';
import { addSchool } from '@/app/actions/school';
import SchoolList from './SchoolList';

async function getStats() {
    const schoolCount = await db.school.count();
    const userCount = await db.user.count();
    const schools = await db.school.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            users: {
                where: { role: 'SCHOOL_ADMIN' },
                select: { email: true }
            }
        }
    });
    return { schoolCount, userCount, schools };
}

export default async function SuperAdminDashboard() {
    const stats = await getStats();

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Super Admin Dashboard
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {/* Stat Card 1 */}
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Total Schools
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {stats.schoolCount}
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="card">
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Total Users
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {stats.userCount}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* School List */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Registered Schools
                    </h2>
                    <SchoolList schools={stats.schools} />
                </div>

                {/* Add School Form */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Add New School
                    </h2>
                    <div className="card">
                        <form action={addSchool}>
                            <div className="input-group">
                                <label className="input-label" htmlFor="name">School Name</label>
                                <input id="name" name="name" type="text" className="input-field" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label" htmlFor="address">Address</label>
                                <input id="address" name="address" type="text" className="input-field" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label" htmlFor="email">Admin Email</label>
                                <input id="email" name="email" type="email" className="input-field" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label" htmlFor="password">Admin Password</label>
                                <input id="password" name="password" type="password" className="input-field" required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Add School
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
