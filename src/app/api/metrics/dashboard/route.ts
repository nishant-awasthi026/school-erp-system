import { NextResponse } from 'next/server';
import { register } from '@/lib/observability/metrics';

export async function GET() {
  try {
    const metricsRaw = await register.getMetricsAsJSON();
    
    // Transform metrics for the dashboard
    // We want to return a simplified structure that the frontend can easily consume
    
    const transformedMetrics = metricsRaw.map(m => ({
      name: m.name,
      help: m.help,
      type: m.type,
      values: m.values.map(v => ({
        value: v.value,
        labels: v.labels
      }))
    }));

    return NextResponse.json({
      success: true,
      data: transformedMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to generate dashboard metrics:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
