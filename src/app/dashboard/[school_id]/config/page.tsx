'use client';

import React, { useState, useEffect } from 'react';

export default function ConfigPage({ params }: { params: React.PropsWithChildren<{ school_id: string }> }) {
    const { school_id } = React.use(params as any) as any;
    const [activeSection, setActiveSection] = useState('identity');
    const [formData, setFormData] = useState<any>({ school: {}, config: {} });
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoAcknowledge, setLogoAcknowledge] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/school/${school_id}/config`)
            .then(res => res.json())
            .then(data => {
                const config = data.config || {};
                
                const parseJsonWithDefault = (val: any, def: any) => {
                     if (!val) return def;
                     if (typeof val === 'string') {
                         try { return JSON.parse(val); } catch(e) { return def; }
                     }
                     return val;
                };

                config.attendanceStatusToggles = parseJsonWithDefault(config.attendanceStatusToggles, { PRESENT: true, ABSENT: true, LATE: true, ON_DUTY: false, MEDICAL_LEAVE: false });
                config.attendanceRules = parseJsonWithDefault(config.attendanceRules, {});
                config.timings = parseJsonWithDefault(config.timings, {});
                
                setFormData({ school: data.school || {}, config });
                setLoading(false);
            });
    }, [school_id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const patchPayload = {
                school: formData.school,
                config: {
                    ...formData.config,
                    attendanceStatusToggles: JSON.stringify(formData.config.attendanceStatusToggles),
                    attendanceRules: JSON.stringify(formData.config.attendanceRules),
                    timings: JSON.stringify(formData.config.timings)
                }
            };
            
            const res = await fetch(`/api/school/${school_id}/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patchPayload),
            });
            if (res.ok) {
                alert('All configurations saved successfully!');
            } else {
                alert('Failed to save configuration.');
            }
        } catch (error) {
            alert('Error updating configuration.');
        } finally {
            setSaving(false);
        }
    };
    
    const updateSchool = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, school: { ...prev.school, [key]: value } }));
    };

    const updateNestedConfig = (parentKey: string, key: string, value: any) => {
        setFormData((prev: any) => ({ 
            ...prev, 
            config: { 
                ...prev.config, 
                [parentKey]: { ...(prev.config[parentKey] || {}), [key]: value } 
            } 
        }));
    };
    
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoUploading(true);
        const uploadParams = new FormData();
        uploadParams.append('file', file);
        try {
            const res = await fetch('/api/upload/imagekit', { method: 'POST', body: uploadParams });
            if (res.ok) {
                const data = await res.json();
                updateSchool('logoUrl', data.publicUrl);
                
                // Immediately save the uploaded logo to DB and acknowledge
                await fetch(`/api/school/${school_id}/config`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ school: { logoUrl: data.publicUrl } })
                });

                setLogoAcknowledge(true);
                setTimeout(() => setLogoAcknowledge(false), 4000);
            } else {
                alert('Logo upload failed.');
            }
        } catch (err) {
            alert('Logo upload failed.');
        } finally {
            setLogoUploading(false);
        }
    };

    if (loading) return <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading configuration...</div>;

    const nav = (id: string) => setActiveSection(id);

    return (
        <div className="config-container srm-theme">
            <div className="mb-4">
                <a href={`/dashboard/${school_id}`} className="inline-flex items-center gap-2 text-sm text-[#3170B1] hover:underline font-medium">
                    ← Back to Dashboard
                </a>
            </div>
            <div className="cfg-wrap flex flex-col md:flex-row">
                <div className="cfg-sidebar md:w-[220px] w-full border-b md:border-b-0 md:border-r border-[#f1f5f9]">
                    <div className="sidebar-title">Configuration</div>
                    <NavItem id="identity" active={activeSection} onClick={nav} icon={<IdentityIcon />} label="School identity" />
                    <NavItem id="attendance" active={activeSection} onClick={nav} icon={<AttendanceIcon />} label="Attendance" />
                    <NavItem id="academic" active={activeSection} onClick={nav} icon={<AcademicIcon />} label="Academic structure" />
                    <NavItem id="timing" active={activeSection} onClick={nav} icon={<TimingIcon />} label="Timing & shifts" />
                    <NavItem id="holidays" active={activeSection} onClick={nav} icon={<HolidayIcon />} label="Holiday calendar" />
                    <NavItem id="fees" active={activeSection} onClick={nav} icon={<FeesIcon />} label="Late fees policy" />
                    
                    <div className="nav-sep"></div>
                    <div className="sidebar-title">Integrations</div>
                    <NavItem id="api" active={activeSection} onClick={nav} icon={<ApiIcon />} label="APIs & SMS" />
                    <NavItem id="iot" active={activeSection} onClick={nav} icon={<IotIcon />} label="IoT gateway" />
                    <NavItem id="notifications" active={activeSection} onClick={nav} icon={<NotificationIcon />} label="Notifications" />
                    
                    <div className="nav-sep"></div>
                    <div className="sidebar-title">Documents</div>
                    <NavItem id="signatures" active={activeSection} onClick={nav} icon={<SignatureIcon />} label="Signatures" />
                    <NavItem id="templates" active={activeSection} onClick={nav} icon={<TemplateIcon />} label="Doc templates" />
                    <NavItem id="security" active={activeSection} onClick={nav} icon={<SecurityIcon />} label="Security & data" />
                </div>

                <div className="cfg-content flex-1 max-w-[100vw]">
                    {/* IDENTITY */}
                    <Panel id="identity" active={activeSection}>
                        <div className="section-head"><h2>School identity</h2><p>Core branding, affiliation, and contact details used across all modules and documents.</p></div>
                        <label className="upload-box" style={{ marginBottom: '16px', display: 'block' }}>
                            <input type="file" style={{ display: 'none' }} onChange={handleLogoUpload} accept="image/*" />
                            {logoUploading ? <div style={{ fontSize: '13px', padding: '10px' }}>Uploading...</div> : formData.school.logoUrl ? (
                                <img src={formData.school.logoUrl} alt="Logo" style={{ maxHeight: '80px', margin: '0 auto 8px' }} />
                            ) : (
                                <div className="upload-icon">+</div>
                            )}
                            <strong style={{ fontSize: '13px' }}>{formData.school.logoUrl ? 'Change school logo' : 'Upload school logo'}</strong>
                            <p>PNG or SVG, min 200×200px. Used on receipts, report cards, certificates, and portal header.</p>
                        </label>
                        {logoAcknowledge && (
                            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#EAF3DE', color: '#3B6D11', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ✓ Logo updated successfully and set as brand logo!
                            </div>
                        )}
                        <div className="grid2">
                            <FieldRow label="School name" value={formData.school.name || ''} onChange={(v: string) => updateSchool('name', v)} placeholder="Delhi Public School, Ghaziabad" />
                            <FieldRow label="Short name / code" value={formData.school.udiseCode || ''} onChange={(v: string) => updateSchool('udiseCode', v)} placeholder="DPS-GZB" />
                        </div>
                        <div className="grid2">
                            <FieldRow label="Affiliation board" type="select" value={formData.school.board || ''} onChange={(v: string) => updateSchool('board', v)} options={['CBSE', 'ICSE', 'UP Board', 'IB', 'State Board', 'Other']} />
                            <FieldRow label="Affiliation number" placeholder="2130XXX" />
                        </div>
                        <div className="grid2">
                            <FieldRow label="Principal Name" value={formData.school.principalName || ''} onChange={(v: string) => updateSchool('principalName', v)} placeholder="Dr. John Doe" />
                            <FieldRow label="Contact phone" value={formData.school.phone || ''} onChange={(v: string) => updateSchool('phone', v)} placeholder="+91 98XXXXXXXX" />
                        </div>
                        <FieldRow label="School address" type="textarea" value={formData.school.address || ''} onChange={(v: string) => updateSchool('address', v)} placeholder="Full address as it should appear on documents" />
                        <div className="save-bar"><button className="btn">Reset</button><button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save all changes'}</button></div>
                    </Panel>

                    {/* ATTENDANCE */}
                    <Panel id="attendance" active={activeSection}>
                        <div className="section-head"><h2>Attendance configuration</h2><p>Toggle which attendance statuses are visible per role. Only checked options appear in the attendance marking UI.</p></div>
                        <div className="card">
                            <div className="card-title">Teacher attendance options</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>Select the statuses teachers can be marked with</div>
                            <div className="check-group">
                                {[{ k: 'PRESENT', l: 'Present' }, { k: 'ABSENT', l: 'Absent' }, { k: 'LATE', l: 'Late arrival' }, { k: 'ON_DUTY', l: 'On duty' }, { k: 'MEDICAL_LEAVE', l: 'Medical leave' }].map(opt => (
                                    <CheckChip 
                                        key={opt.k} 
                                        label={opt.l} 
                                        checked={formData.config.attendanceStatusToggles?.[opt.k] ?? false} 
                                        onChange={(c: boolean) => updateNestedConfig('attendanceStatusToggles', opt.k, c)} 
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title">Attendance rules</div>
                            <ToggleRow 
                                label="Allow retroactive marking" 
                                desc="Teachers can mark/edit attendance for past dates" 
                                checked={formData.config.attendanceRules?.allowRetroactive ?? false}
                                onChange={(c: boolean) => updateNestedConfig('attendanceRules', 'allowRetroactive', c)}
                            />
                            <ToggleRow 
                                label="Auto-absent after gate close" 
                                desc="Mark absent if no biometric entry after gate closing time" 
                                checked={formData.config.attendanceRules?.autoAbsent ?? false}
                                onChange={(c: boolean) => updateNestedConfig('attendanceRules', 'autoAbsent', c)}
                            />
                        </div>
                        <div className="save-bar"><button className="btn">Reset</button><button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save all changes'}</button></div>
                    </Panel>

                    {/* API */}
                    <Panel id="api" active={activeSection}>
                        <div className="section-head"><h2>APIs & SMS integrations</h2><p>Connect external services for messaging, payments, and data exchange.</p></div>
                        <div className="card">
                            <div className="card-title">SMS provider</div>
                            <FieldRow label="Provider" type="select" options={['MSG91', 'Fast2SMS', 'Twilio', 'TextLocal', 'Custom HTTP API', 'IoT gateway (ESP32)']} />
                            <div className="grid2">
                                <FieldRow label="API key / Auth token" placeholder="••••••••••••••••" type="password" />
                                <FieldRow label="Sender ID / DLT template" placeholder="SCHOOL" />
                            </div>
                            <button className="btn" style={{ marginTop: '4px', fontSize: '12px' }}>Test SMS</button>
                        </div>
                        <div className="card">
                            <div className="card-title">Payment gateway</div>
                            <FieldRow label="Provider" type="select" options={['Razorpay', 'PayU', 'Cashfree', 'CCAvenue']} />
                            <div className="grid2">
                                <FieldRow label="Key ID" placeholder="rzp_live_XXXXXXXX" />
                                <FieldRow label="Key secret" placeholder="••••••••••••••••" type="password" />
                            </div>
                        </div>
                        <div className="save-bar"><button className="btn">Reset</button><button className="btn btn-primary">Save all integrations</button></div>
                    </Panel>

                    {/* SIGNATURES */}
                    <Panel id="signatures" active={activeSection}>
                        <div className="section-head"><h2>Authorized signatures</h2><p>Upload digital signatures that auto-embed on receipts, certificates, TCs, and report cards.</p></div>
                        <div className="card">
                            <div className="card-title">Signature slots</div>
                            <div className="grid3">
                                <SigBox label="Principal" desc="Used on: TC, certificates" />
                                <SigBox label="Accountant" desc="Used on: fee receipts" />
                                <SigBox label="Class teacher" desc="Used on: report cards" />
                                <SigBox label="Vice-principal" desc="Used on: admit cards" />
                                <SigBox label="School stamp" desc="Overlay on all documents" />
                                <SigBox label="Custom role" desc="Define use manually" />
                            </div>
                        </div>
                        <div className="save-bar"><button className="btn">Preview on receipt</button><button className="btn btn-primary">Save signatures</button></div>
                    </Panel>

                    {/* ACADEMIC */}
                    <Panel id="academic" active={activeSection}>
                        <div className="section-head"><h2>Academic structure</h2><p>Define grading scale, term/exam setup, passing criteria, and promotion rules.</p></div>
                        <div className="card">
                            <div className="card-title">Grading system</div>
                            <FieldRow label="Grading type" type="select" options={['Marks based (absolute)', 'Grade point (GPA)', 'CBSE CCE (A1–E)', 'Custom grades']} />
                            <div className="grid3" style={{ marginTop: '8px' }}>
                                <FieldRow label="Max marks per subject" type="number" defaultValue="100" />
                                <FieldRow label="Passing marks" type="number" defaultValue="33" />
                                <FieldRow label="Passing % (overall)" type="number" defaultValue="40" />
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '600', margin: '8px 0 6px', color: 'var(--color-text-secondary)' }}>Grade boundaries</div>
                            <table className="table-sm">
                                <thead><tr><th>Grade</th><th>Min marks (%)</th><th>Max marks (%)</th><th>Remark</th></tr></thead>
                                <tbody>
                                    <tr><td>A1</td><td><input type="number" className="small-input" defaultValue="91" /></td><td>100</td><td>Outstanding</td></tr>
                                    <tr><td>A2</td><td>81</td><td>90</td><td>Excellent</td></tr>
                                    <tr><td>B1</td><td>71</td><td>80</td><td>Very Good</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="save-bar"><button className="btn">Reset</button><button className="btn btn-primary">Save changes</button></div>
                    </Panel>

                    {/* TIMING */}
                    <Panel id="timing" active={activeSection}>
                        <div className="section-head"><h2>Timing & shifts</h2><p>Configure gate times, school shifts, working days, and special schedules.</p></div>
                        <div className="card">
                            <div className="card-title">Gate & school timings</div>
                            <div className="grid2">
                                <FieldRow label="Gate opens (students)" type="time" defaultValue="07:00" />
                                <FieldRow label="Gate closes (late cutoff)" type="time" defaultValue="08:30" />
                            </div>
                            <div className="grid2">
                                <FieldRow label="School starts (assembly)" type="time" defaultValue="07:30" />
                                <FieldRow label="School ends" type="time" defaultValue="14:00" />
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title">Working days</div>
                            <div className="check-group">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <CheckChip key={day} label={day} checked={day !== 'Sunday'} />
                                ))}
                            </div>
                        </div>
                        <div className="save-bar"><button className="btn">Reset</button><button className="btn btn-primary">Save changes</button></div>
                    </Panel>

                    {/* HOLIDAYS */}
                    <Panel id="holidays" active={activeSection}>
                        <div className="section-head"><h2>Holiday calendar</h2><p>Define school holidays, gazetted leaves, and events for the current academic year.</p></div>
                        <div className="card">
                            <div className="card-title">Add holiday</div>
                            <div className="grid3">
                                <FieldRow label="Date" type="date" />
                                <FieldRow label="Holiday name" placeholder="Republic Day" />
                                <FieldRow label="Type" type="select" options={['National holiday', 'State holiday', 'School event', 'Festival']} />
                            </div>
                            <ToggleRow label="Apply to staff attendance also" checked />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}><button className="btn btn-primary">Add holiday</button></div>
                        </div>
                        <div className="card">
                            <div className="card-title">Upcoming holidays</div>
                            <table className="table-sm">
                                <thead><tr><th>Date</th><th>Holiday</th><th>Type</th><th>Status</th></tr></thead>
                                <tbody>
                                    <tr><td>26 Jan 2026</td><td>Republic Day</td><td><span className="badge badge-blue">National</span></td><td>Active</td></tr>
                                    <tr><td>14 Mar 2026</td><td>Holi</td><td><span className="badge badge-amber">Festival</span></td><td>Active</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="save-bar"><button className="btn btn-primary">Save changes</button></div>
                    </Panel>

                    {/* NOTIFICATIONS */}
                    <Panel id="notifications" active={activeSection}>
                        <div className="section-head"><h2>Notification preferences</h2><p>Control which events trigger SMS, WhatsApp, or email alerts.</p></div>
                        <div className="card">
                            <table className="table-sm">
                                <thead><tr><th>Event</th><th>SMS</th><th>WhatsApp</th><th>Email</th></tr></thead>
                                <tbody>
                                    {[
                                        { event: 'Student absent', sms: true, wax: true, mail: false },
                                        { event: 'Fee due reminder', sms: true, wax: true, mail: true },
                                        { event: 'Exam result ready', sms: true, wax: true, mail: true },
                                        { event: 'Gate entry', sms: true, wax: false, mail: false },
                                    ].map(row => (
                                        <tr key={row.event}>
                                            <td>{row.event}</td>
                                            <td><input type="checkbox" defaultChecked={row.sms} className="accent-[#378ADD]" /></td>
                                            <td><input type="checkbox" defaultChecked={row.wax} className="accent-[#378ADD]" /></td>
                                            <td><input type="checkbox" defaultChecked={row.mail} className="accent-[#378ADD]" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="save-bar"><button className="btn btn-primary">Save preferences</button></div>
                    </Panel>

                    {/* Remaining as placeholders for brevity */}
                    {['fees', 'iot', 'templates', 'security'].map(id => (
                        <Panel key={id} id={id} active={activeSection}>
                             <div className="section-head">
                                <h2>{id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ')}</h2>
                                <p>Configuration for {id.replace('-', ' ')} module.</p>
                             </div>
                             <div className="p-12 text-center text-[#94a3b8]">
                                <div className="text-4xl mb-4">⚙️</div>
                                <p>Detailed settings for this module are under development.</p>
                             </div>
                        </Panel>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .config-container {
                    --sidebar-w: 220px;
                    --color-border-secondary: #e2e8f0;
                    --color-border-tertiary: #f1f5f9;
                    --color-background-primary: #ffffff;
                    --color-background-secondary: #f8fafc;
                    --color-text-primary: #1e293b;
                    --color-text-secondary: #475569;
                    --color-text-tertiary: #94a3b8;
                    --font-sans: 'Inter', sans-serif;
                    --border-radius-md: 6px;
                    --border-radius-lg: 10px;
                }
                .cfg-wrap { 
                    display: flex; 
                    gap: 0; 
                    min-height: 600px; 
                    border: 0.5px solid var(--color-border-tertiary); 
                    border-radius: var(--border-radius-lg); 
                    overflow: hidden; 
                    background: var(--color-background-primary); 
                }
                .cfg-sidebar { 
                    padding: 16px 0; 
                    background: var(--color-background-secondary); 
                    flex-shrink: 0; 
                }
                .sidebar-title { 
                    font-size: 11px; 
                    font-weight: 600; 
                    color: var(--color-text-tertiary); 
                    padding: 0 16px 8px; 
                    letter-spacing: .06em; 
                    text-transform: uppercase; 
                }
                .nav-sep { height: 0.5px; background: var(--color-border-tertiary); margin: 8px 0; }
                .cfg-content { padding: 24px; overflow-y: auto; max-height: calc(100vh - 120px); }
                .section-head { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 0.5px solid var(--color-border-tertiary); }
                .section-head h2 { font-size: 16px; font-weight: 600; color: #3170B1; }
                .section-head p { font-size: 12px; color: var(--color-text-tertiary); margin-top: 3px; }
                .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                .card { background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 16px; margin-bottom: 16px; }
                .card-title { font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--color-text-primary); }
                .upload-box { border: 0.5px dashed var(--color-border-secondary); border-radius: var(--border-radius-lg); padding: 24px; text-align: center; cursor: pointer; transition: border-color .15s; }
                .upload-box:hover { border-color: #378ADD; }
                .upload-box p { font-size: 12px; color: var(--color-text-tertiary); margin-top: 6px; }
                .upload-icon { font-size: 24px; line-height: 1; margin-bottom: 4px; }
                .save-bar { display: flex; justify-content: flex-end; gap: 10px; padding-top: 20px; border-top: 0.5px solid var(--color-border-tertiary); margin-top: 20px; }
                .btn { padding: 7px 18px; border-radius: var(--border-radius-md); font-size: 13px; cursor: pointer; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-primary); transition: all 0.2s; }
                .btn-primary { background: #378ADD; color: #fff; border-color: #378ADD; font-weight: 600; }
                .btn-primary:hover { background: #185FA5; border-color: #185FA5; }
                .table-sm { width: 100%; border-collapse: collapse; font-size: 12px; }
                .table-sm th { font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); padding: 8px; text-align: left; border-bottom: 0.5px solid var(--color-border-tertiary); }
                .table-sm td { padding: 10px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); color: var(--color-text-primary); }
                .small-input { width: 70px; padding: 3px 6px; border: 0.5px solid var(--color-border-secondary); border-radius: 4px; background: var(--color-background-primary); color: var(--color-text-primary); font-size: 12px; }
                .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
                .badge-blue { background: #E6F1FB; color: #185FA5; }
                .badge-amber { background: #FAEEDA; color: #854F0B; }
                .badge-green { background: #EAF3DE; color: #3B6D11; }
            `}</style>
        </div>
    );
}

// Sub-components for cleaner structure
function NavItem({ id, active, onClick, icon, label }: any) {
    return (
        <div className={`cfg-nav-item ${active === id ? 'active' : ''}`} onClick={() => onClick(id)}>
            <span className="cfg-nav-icon">{icon}</span>
            {label}
            <style jsx>{`
                .cfg-nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; cursor: pointer; font-size: 13px; color: var(--color-text-secondary); transition: all .15s; border-left: 2px solid transparent; }
                .cfg-nav-item:hover { background: var(--color-background-primary); color: var(--color-text-primary); }
                .cfg-nav-item.active { background: var(--color-background-primary); color: var(--color-text-primary); border-left: 2px solid #378ADD; font-weight: 600; }
                .cfg-nav-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; opacity: .7; }
            `}</style>
        </div>
    );
}

function Panel({ id, active, children }: any) {
    if (id !== active) return null;
    return <div className="panel animate-in fade-in duration-300">{children}</div>;
}

function FieldRow({ label, placeholder, type = 'text', options = [], value, onChange }: any) {
    return (
        <div className="field-row">
            <label>{label}</label>
            {type === 'select' ? (
                <select className="select-input" value={value || ''} onChange={(e) => onChange?.(e.target.value)}>
                    {options.map((o: any) => <option key={o}>{o}</option>)}
                </select>
            ) : type === 'textarea' ? (
                <textarea className="textarea-input" placeholder={placeholder} value={value || ''} onChange={(e) => onChange?.(e.target.value)} style={{ height: '56px', resize: 'none' }} />
            ) : (
                <input type={type} className="text-input" placeholder={placeholder} value={value || ''} onChange={(e) => onChange?.(e.target.value)} />
            )}
            <style jsx>{`
                .field-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
                .field-row label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
                .text-input, .select-input, .textarea-input { 
                    border: 0.5px solid var(--color-border-secondary); 
                    border-radius: var(--border-radius-md); 
                    padding: 7px 10px; 
                    font-size: 13px; 
                    color: var(--color-text-primary); 
                    background: var(--color-background-primary); 
                    width: 100%; 
                    transition: border-color 0.2s;
                }
                .text-input:focus, .select-input:focus { outline: none; border-color: #378ADD; }
            `}</style>
        </div>
    );
}

function CheckChip({ label, checked, onChange }: any) {
    return (
        <label className={`check-chip ${checked ? 'checked' : ''}`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} /> {label}
            <style jsx>{`
                .check-chip { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); cursor: pointer; font-size: 12px; color: var(--color-text-secondary); background: var(--color-background-primary); transition: all .15s; user-select: none; }
                .check-chip input { width: 13px; height: 13px; accent-color: #378ADD; cursor: pointer; }
                .check-chip.checked { border-color: #378ADD; background: #E6F1FB; color: #185FA5; }
            `}</style>
        </label>
    );
}

function ToggleRow({ label, desc, checked, onChange }: any) {
    return (
        <div className="toggle-row">
            <div>
                <div className="toggle-label">{label}</div>
                {desc && <div className="toggle-desc">{desc}</div>}
            </div>
            <label className="toggle">
                <input type="checkbox" checked={checked || false} onChange={(e) => onChange?.(e.target.checked)} />
                <span className="slider"></span>
            </label>
            <style jsx>{`
                .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
                .toggle-row:last-child { border-bottom: none; }
                .toggle-label { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
                .toggle-desc { font-size: 11px; color: var(--color-text-tertiary); margin-top: 1px; }
                .toggle { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
                .toggle input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; inset: 0; background: var(--color-border-secondary); border-radius: 20px; transition: .2s; }
                .slider:before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s; }
                .toggle input:checked + .slider { background: #378ADD; }
                .toggle input:checked + .slider:before { transform: translateX(16px); }
            `}</style>
        </div>
    );
}

function SigBox({ label, desc }: any) {
    return (
        <div className="sig-item">
            <div className="sig-box">
                <strong style={{ fontSize: '12px' }}>+ Upload</strong>
                <span className="sig-label">{label}</span>
            </div>
            <div className="sig-meta">{desc}</div>
            <style jsx>{`
                .sig-box { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 16px; text-align: center; background: var(--color-background-secondary); height: 90px; display: flex; align-items: center; justify-content: center; flex-direction: column; cursor: pointer; transition: background 0.2s; }
                .sig-box:hover { background: #f1f5f9; }
                .sig-label { font-size: 11px; color: var(--color-text-tertiary); margin-top: 4px; }
                .sig-meta { margin-top: 6px; font-size: 11px; color: var(--color-text-tertiary); text-align: center; }
            `}</style>
        </div>
    );
}

// Simple icons mapped from user's SVGs
const IdentityIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="8" cy="7" r="2"/><path d="M4 13c0-2 1.8-3 4-3s4 1 4 3"/>
    </svg>
);
const AttendanceIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v3M11 1v3M2 7h12M5.5 10l1.5 1.5L11 9" strokeLinecap="round"/>
    </svg>
);
const AcademicIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M8 2L14 5v3c0 3-2.5 5-6 6C2.5 13 0 11 0 8V5l6-3z" transform="translate(1 1)"/>
    </svg>
);
const TimingIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="8" cy="8" r="5.5"/><path d="M8 5.5V8l2 1.5" strokeLinecap="round"/>
    </svg>
);
const HolidayIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v3M11 1v3M2 7h12"/><circle cx="8" cy="11" r="1.2" fill="currentColor"/>
    </svg>
);
const FeesIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M4 9h4M4 12h8" strokeLinecap="round"/>
    </svg>
);
const ApiIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 5h10M3 8h6M3 11h8" strokeLinecap="round"/><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/>
    </svg>
);
const IotIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="8" cy="4" r="1.5"/><path d="M5.5 8h5M4 6.5l4-1.5"/>
    </svg>
);
const NotificationIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M8 2a4.5 4.5 0 0 0-4.5 4.5c0 2-.5 3-1 3.5h11c-.5-.5-1-1.5-1-3.5A4.5 4.5 0 0 0 8 2z"/><path d="M6.5 10.5a1.5 1.5 0 0 0 3 0"/>
    </svg>
);
const SignatureIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 11c2-3 3-4 5-4s2.5 2 4 2" strokeLinecap="round"/><path d="M2 13h12" strokeLinecap="round"/><path d="M5 8.5V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3.5"/>
    </svg>
);
const TemplateIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="2" width="12" height="12" rx="1.5"/><rect x="4" y="4" width="4" height="3" rx=".5" fill="currentColor" opacity=".3"/><path d="M4 9h8M4 11h5" strokeLinecap="round"/>
    </svg>
);
const SecurityIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M8 1.5L2.5 4v3.5c0 3 2 5 5.5 6 3.5-1 5.5-3 5.5-6V4L8 1.5z"/><path d="M5.5 8l1.5 1.5L10 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
