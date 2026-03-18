'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    parseCSV, generateCSV,
    TEACHER_TEMPLATE_HEADERS, TEACHER_TEMPLATE_SAMPLE,
} from '@/lib/csvParser';

interface ImportRow { row: number; name: string; email: string; status: 'success' | 'error'; error?: string }
interface PreviewRow { [key: string]: string }

export default function TeacherImportPage({ params }: { params: Promise<{ school_id: string }> }) {
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<{ headers: string[]; rows: PreviewRow[] } | null>(null);
    const [parseError, setParseError] = useState('');
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ total: number; successCount: number; failCount: number; results: ImportRow[] } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    if (!schoolId) { params.then(p => setSchoolId(p.school_id)); }

    const downloadTemplate = () => {
        const csv = generateCSV(TEACHER_TEMPLATE_HEADERS, TEACHER_TEMPLATE_SAMPLE.map(r =>
            Object.fromEntries(TEACHER_TEMPLATE_HEADERS.map(h => [h, r[h as keyof typeof r] ?? '']))
        ));
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'teacher_import_template.csv'; a.click();
    };

    const handleFile = useCallback((f: File) => {
        setFile(f); setResult(null); setParseError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const { headers, rows, errors } = parseCSV(text);
            if (errors.length) { setParseError(errors.join('; ')); setPreview(null); return; }
            setPreview({ headers, rows: rows.slice(0, 5) });
        };
        reader.readAsText(f);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) handleFile(f);
    }, [handleFile]);

    const handleImport = async () => {
        if (!file || !schoolId) return;
        setUploading(true); setResult(null);
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await fetch(`/api/schools/${schoolId}/employees/import`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.success) setResult(data.data);
            else setParseError(data.error?.message || 'Import failed');
        } catch (e) { setParseError('Network error during import'); }
        finally { setUploading(false); }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📥 Bulk Import Teachers</h1>
                    <p className="page-subtitle">Upload a CSV file to add multiple staff members at once</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={downloadTemplate} className="btn btn-ghost">⬇️ Download Template</button>
                    {schoolId && <Link href={`/dashboard/${schoolId}/employees`} className="btn btn-ghost">👨‍🏫 View All Staff</Link>}
                </div>
            </div>

            {/* Instructions */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--success-light)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--success)' }}>📋 How to use Bulk Import</div>
                <ol style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <li>Click <strong>Download Template</strong> to get the CSV with correct columns.</li>
                    <li>Fill in teacher data — one teacher per row.</li>
                    <li>For multiple subjects, separate with a pipe: <code>Physics|Chemistry</code></li>
                    <li>Save as <code>.csv</code> and upload below.</li>
                    <li>Preview data, then click <strong>Import Teachers</strong> to create accounts.</li>
                </ol>
            </div>

            {!result && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragging ? 'var(--success)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-xl)', padding: '3rem', textAlign: 'center',
                        cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.5rem',
                        background: dragging ? 'var(--success-light)' : 'var(--surface)',
                    }}>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📄</div>
                    {file ? (
                        <>
                            <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '0.25rem' }}>{file.name}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>Drag & drop your CSV here</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>or click to browse</div>
                        </>
                    )}
                </div>
            )}

            {parseError && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>⚠️ {parseError}</div>}

            {preview && !result && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>📊 Preview (first 5 rows)</div>
                        </div>
                        <button className="btn btn-primary" onClick={handleImport} disabled={uploading} style={{ minWidth: '160px' }}>
                            {uploading
                                ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                    Importing...
                                  </span>
                                : '🚀 Import Teachers'
                            }
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>{preview.headers.map(h => <th key={h}>{h.replace(/_/g, ' ')}</th>)}</tr>
                            </thead>
                            <tbody>
                                {preview.rows.map((r, i) => (
                                    <tr key={i}>{preview.headers.map(h => (
                                        <td key={h} style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                                            {r[h] || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                    ))}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {result && (
                <div className="animate-fade-in">
                    <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Rows', value: result.total, icon: '📋', color: 'var(--primary)', bg: 'var(--primary-light)' },
                            { label: 'Imported', value: result.successCount, icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
                            { label: 'Failed', value: result.failCount, icon: '❌', color: result.failCount > 0 ? 'var(--error)' : 'var(--text-muted)', bg: result.failCount > 0 ? 'var(--error-light)' : 'var(--surface-2)' },
                        ].map(c => (
                            <div key={c.label} className="stat-card">
                                <div className="stat-card-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                                <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                                <div className="stat-card-label">{c.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700 }}>Import Report</div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => { setResult(null); setFile(null); setPreview(null); }} className="btn btn-ghost btn-sm">Import More</button>
                                {schoolId && <Link href={`/dashboard/${schoolId}/employees`} className="btn btn-primary btn-sm">View Staff</Link>}
                            </div>
                        </div>
                        <table className="data-table">
                            <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Result</th></tr></thead>
                            <tbody>
                                {result.results.map(r => (
                                    <tr key={r.row}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>#{r.row}</td>
                                        <td style={{ fontWeight: 500 }}>{r.name}</td>
                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{r.email}</td>
                                        <td>
                                            {r.status === 'success'
                                                ? <span className="badge badge-green">✓ Imported</span>
                                                : <span className="badge badge-red" title={r.error}>✗ {r.error}</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
