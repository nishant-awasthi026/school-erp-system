'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdmissionsManagement() {
    const params = useParams();
    const router = useRouter();
    const schoolId = params.school_id;

    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, [schoolId]);

    const fetchApplications = async () => {
        try {
            const res = await fetch(`/api/schools/${schoolId}/admissions`);
            const data = await res.json();
            if (data.success) {
                setApplications(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch applications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, status: 'ADMITTED' | 'WITHDRAWN') => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/schools/${schoolId}/admissions/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                fetchApplications();
                router.refresh();
            }
        } catch (err) {
            alert('Failed to update application');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading applications...</div>;

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Admission Applications</h1>
                    <p className="page-subtitle">Review and process new student applications.</p>
                </div>
            </div>

            <div className="card">
                {applications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="text-4xl mb-2">📄</div>
                        <p>No pending applications at the moment.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-4 font-semibold text-gray-700">Student Name</th>
                                    <th className="p-4 font-semibold text-gray-700">Parent Info</th>
                                    <th className="p-4 font-semibold text-gray-700">Applied On</th>
                                    <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{app.name}</div>
                                            <div className="text-sm text-gray-500">{app.studentProfile?.admissionStatus}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium">{app.studentProfile?.parentName}</div>
                                            <div className="text-xs text-gray-500">{app.studentProfile?.parentPhone}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button 
                                                onClick={() => handleAction(app.id, 'ADMITTED')}
                                                disabled={!!actionLoading}
                                                className="btn btn-primary btn-sm"
                                            >
                                                {actionLoading === app.id ? '...' : 'Approve'}
                                            </button>
                                            <button 
                                                onClick={() => handleAction(app.id, 'WITHDRAWN')}
                                                disabled={!!actionLoading}
                                                className="btn btn-ghost btn-danger btn-sm"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
