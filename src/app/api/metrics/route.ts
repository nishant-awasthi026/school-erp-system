import { NextResponse } from 'next/server';
import { register } from '@/lib/observability/metrics';

export async function GET() {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (err) {
    console.error('Failed to generate metrics:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
