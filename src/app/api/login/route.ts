import { NextRequest, NextResponse } from 'next/server';
import { loginUser, signToken } from '@/lib/auth';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create session
        await loginUser({
            userId: user.id,
            email: user.email,
            role: user.role as any,
            schoolId: user.schoolId || undefined,
        });

        // Determine redirect URL based on role
        let redirectUrl = '/dashboard';
        if (user.role === 'SUPER_ADMIN') {
            redirectUrl = '/dashboard/super-admin';
        } else if (user.schoolId) {
            redirectUrl = `/dashboard/${user.schoolId}`;
        }

        return NextResponse.json({ success: true, redirectUrl });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
