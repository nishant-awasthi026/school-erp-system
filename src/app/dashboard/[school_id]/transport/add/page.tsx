import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { sanitizeStopsJSON } from '@/lib/utils/sanitize';

interface PageProps {
    params: Promise<{ school_id: string }>;
}

async function handleAddRoute(schoolId: string, formData: FormData) {
    'use server';
    const name             = formData.get('name') as string;
    const stopsJson        = formData.get('stops') as string;
    const regNumber        = formData.get('registrationNumber') as string;
    const driverName       = formData.get('driverName') as string;
    const driverPhone      = formData.get('driverPhone') as string;
    const capacity         = parseInt(formData.get('capacity') as string);
    const fitnessExpiry    = formData.get('fitnessExpiry') as string;

    if (!name || !driverName || !driverPhone || !regNumber) {
        throw new Error('Route name, driver details, and vehicle registration are required');
    }

    // Parse stop names into JSON array
    const stopNames = stopsJson.split('\n').map(s => s.trim()).filter(Boolean);
    const rawStops = JSON.stringify(stopNames.map(n => ({ name: n, time: '' })));
    const stops = sanitizeStopsJSON(rawStops) || rawStops;

    await db.$transaction(async (tx: any) => {
        const route = await tx.transportRoute.create({
            data: { name, stops, schoolId },
        });
        await tx.vehicle.create({
            data: {
                routeId: route.id,
                registrationNumber: regNumber,
                driverName,
                driverPhone,
                capacity: capacity || 40,
                fitnessExpiry: new Date(fitnessExpiry),
                schoolId,
            },
        });
    });

    redirect(`/dashboard/${schoolId}/transport`);
}

export default async function AddTransportRoutePage({ params }: PageProps) {
    const { school_id } = await params;
    const school = await db.school.findUnique({ where: { id: school_id } });
    if (!school) notFound();

    const addRoute = handleAddRoute.bind(null, school_id);

    // Default fitness expiry: 1 year from now
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    const defaultExpiryStr = defaultExpiry.toISOString().split('T')[0];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🚌 Add Transport Route</h1>
                    <p className="page-subtitle">Configure a new bus route and assign a vehicle</p>
                </div>
                <a href={`/dashboard/${school_id}/transport`} className="btn btn-ghost">← Back to Transport</a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '900px' }}>
                <form action={addRoute} style={{ display: 'contents' }}>
                    {/* Route Details */}
                    <div className="card">
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🗺️ Route Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label className="input-label" htmlFor="name">Route Name *</label>
                                <input id="name" name="name" type="text" className="input-field" required
                                    placeholder="e.g., North Route, Sector 14 Bus" />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="stops">Bus Stops (one per line) *</label>
                                <textarea id="stops" name="stops" className="input-field" rows={6}
                                    placeholder={'School Gate\nMain Market\nSector 14\nNew Colony\nBus Stand'}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Enter each stop on a new line — in pick-up order
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="card">
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🚌 Vehicle & Driver</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label className="input-label" htmlFor="registrationNumber">Vehicle Registration *</label>
                                <input id="registrationNumber" name="registrationNumber" type="text" className="input-field"
                                    required placeholder="e.g., UP32 AB 1234" />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="driverName">Driver Name *</label>
                                <input id="driverName" name="driverName" type="text" className="input-field" required />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="driverPhone">Driver Phone *</label>
                                <input id="driverPhone" name="driverPhone" type="tel" className="input-field"
                                    required placeholder="10-digit mobile number" />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="capacity">Passenger Capacity</label>
                                <input id="capacity" name="capacity" type="number" className="input-field"
                                    defaultValue="40" min="1" max="120" />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="fitnessExpiry">Fitness Certificate Expiry *</label>
                                <input id="fitnessExpiry" name="fitnessExpiry" type="date" className="input-field"
                                    defaultValue={defaultExpiryStr} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <a href={`/dashboard/${school_id}/transport`}
                                style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)' }}>
                                Cancel
                            </a>
                            <button type="submit" className="btn btn-primary">🚌 Add Route</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
