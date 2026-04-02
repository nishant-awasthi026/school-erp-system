import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'STUDENT') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { avatarUrl } = await req.json();

        if (!avatarUrl) {
            return NextResponse.json({ success: false, error: 'Missing avatarUrl' }, { status: 400 });
        }

        // Update the student profile
        await db.studentProfile.update({
            where: { userId: session.userId },
            data: { avatarUrl },
        });

        return NextResponse.json({ success: true, avatarUrl });
    } catch (err: any) {
        console.error('[student/profile/avatar] POST error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
