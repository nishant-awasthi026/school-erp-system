import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
    await logoutUser();
    return NextResponse.json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function GET() {
    await logoutUser();
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
