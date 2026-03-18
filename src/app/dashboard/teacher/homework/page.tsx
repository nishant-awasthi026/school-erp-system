'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Homework = { id: string; title: string; description: string; dueDate: string; class: { name: string }; subject: { name: string }; _count: { submissions: number } };

export default function HomeworkPage() {
    const [homework, setHomework] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/teacher/homework').then(r => r.json()).then(d => {
            if (d.success) setHomework(d.data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📝 Homework</h1>
                    <p className="page-subtitle">{homework.length} assignments</p>
                </div>
                <Link href="/dashboard/teacher/homework/create" className="btn btn-primary">➕ Assign Homework</Link>
            </div>

            {loading ? (
                <div className="card"><div className="empty-state"><div className="animate-spin" style={{fontSize:'2rem'}}>⏳</div></div></div>
            ) : homework.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <div className="empty-state-title">No homework assigned yet</div>
                    <Link href="/dashboard/teacher/homework/create" className="btn btn-primary">Create First Assignment</Link>
                </div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {homework.map(hw => {
                        const dueDate = new Date(hw.dueDate);
                        const isOverdue = dueDate < new Date();
                        return (
                            <div key={hw.id} className="card card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>📝</span>
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{hw.title}</span>
                                        <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`}>{isOverdue ? 'Overdue' : 'Active'}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{hw.description.substring(0, 120)}...</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span className="badge badge-blue">Class {hw.class.name}</span>
                                        <span className="badge badge-purple">{hw.subject.name}</span>
                                        <span className="badge badge-gray">Due: {dueDate.toLocaleDateString()}</span>
                                        <span className="badge badge-green">{hw._count.submissions} submitted</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                                    <Link href={`/dashboard/teacher/homework/${hw.id}`} className="btn btn-ghost btn-sm">View Submissions</Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
