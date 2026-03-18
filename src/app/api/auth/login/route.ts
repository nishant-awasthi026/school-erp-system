import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { signToken, loginUser, getPortalUrl } from '@/lib/auth';
import { ApiError, errorResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
    try {
        const body = validate(LoginSchema, await request.json());

        // Find user
        const user = await db.user.findUnique({
            where: { email: body.email.toLowerCase().trim() },
            include: {
                studentProfile: { select: { id: true } },
                teacherProfile: { select: { id: true } },
            },
        });

        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Check password
        const passwordValid = await bcrypt.compare(body.password, user.password);
        if (!passwordValid) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Determine redirect URL
        const redirectUrl = getPortalUrl(user.role as any, user.schoolId ?? undefined);

        // Build JWT payload
        const jwtPayload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role as any,
            schoolId: user.schoolId ?? undefined,
            teacherProfileId: user.teacherProfile?.id,
            studentProfileId: user.studentProfile?.id,
        };

        // Set HttpOnly cookie
        await loginUser(jwtPayload);

        return NextResponse.json({
            success: true,
            data: {
                redirectUrl,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    schoolId: user.schoolId,
                },
            },
        });
    } catch (err) {
        if (err instanceof ApiError) {
            return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        }
        console.error('[login] Error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
