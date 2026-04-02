'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PromoteClient({ schoolId, classes, initialStudents }: any) {
    const router = useRouter();
    const [fromClassId, setFromClassId] = useState('');
    const [toClassId, setToClassId] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    
    // Status state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const filteredStudents = initialStudents.filter((s: any) => s.classId === fromClassId);

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map((s: any) => s.id));
        }
    };

    const handlePromote = async () => {
        if (!fromClassId || !toClassId) {
            setError('Please select both From and To classes.');
            return;
        }
        if (fromClassId === toClassId) {
            setError('From and To classes cannot be the same.');
            return;
        }
        if (selectedStudents.length === 0) {
            setError('Please select at least one student to promote.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`/api/schools/${schoolId}/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentIds: selectedStudents, targetClassId: toClassId })
            });
            const data = await res.json();
            
            if (!data.success) {
                setError(data.error?.message || 'Promotion failed');
            } else {
                setMessage(`Successfully promoted ${selectedStudents.length} students to the selected class.`);
                // Clear selection and optionally refresh
                setSelectedStudents([]);
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="input-group">
                    <label className="input-label">From Class</label>
                    <select 
                        className="input-field" 
                        value={fromClassId} 
                        onChange={(e) => {
                            setFromClassId(e.target.value);
                            setSelectedStudents([]);
                            setMessage('');
                            setError('');
                        }}
                    >
                        <option value="">-- Select Class --</option>
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>Class {c.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="input-group">
                    <label className="input-label">To Class</label>
                    <select 
                        className="input-field" 
                        value={toClassId} 
                        onChange={(e) => {
                            setToClassId(e.target.value);
                            setMessage('');
                            setError('');
                        }}
                    >
                        <option value="">-- Select Target Class --</option>
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>Class {c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="card" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
            {message && <div className="card" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '8px' }}>{message}</div>}

            {fromClassId && (
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">Select Students ({filteredStudents.length})</h2>
                        <button 
                            className="btn btn-primary" 
                            onClick={handlePromote} 
                            disabled={isSubmitting || selectedStudents.length === 0}
                        >
                            {isSubmitting ? 'Promoting...' : `Promote Selected (${selectedStudents.length})`}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-3 w-12">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} 
                                            onChange={toggleAll} 
                                            disabled={filteredStudents.length === 0}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                    </th>
                                    <th className="p-3 font-semibold text-gray-700">Student Name</th>
                                    <th className="p-3 font-semibold text-gray-700">Roll Number</th>
                                    <th className="p-3 font-semibold text-gray-700">Admission ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-gray-500">
                                            No eligible students found in this class.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student: any) => (
                                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedStudents.includes(student.id)} 
                                                    onChange={() => toggleStudent(student.id)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-gray-800">{student.user.name}</td>
                                            <td className="p-3 text-gray-600">{student.rollNumber || '-'}</td>
                                            <td className="p-3 text-gray-600">{student.studentId || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
