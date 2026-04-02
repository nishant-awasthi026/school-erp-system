import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, loginUser, getPortalUrl } from '@/lib/auth';
import { ApiError, errorResponse } from '@/lib/utils/errors';
import { validate } from '@/lib/utils/validate';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/infra/rate-limit';
import { recordHttpRequest, recordError } from '@/lib/observability/metrics-recorder';
import { BloomFilter, isRedisConfigured } from '@/lib/infra/redis';
import { Singleflight } from '@/lib/infra/distributed-utils';


const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
        
        // Distributed Rate Limiting (Awaited Redis check)
        const rl = await rateLimit(`login_attempt_${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
        if (!rl.success) {
            throw new ApiError(429, 'Too many login attempts, please try again later.', 'RATE_LIMITED');
        }

        const body = validate(LoginSchema, await request.json());
        const email = body.email.toLowerCase().trim();

        // Distributed Pattern: Bloom Filter for fast non-existence rejection
        // Only active when Redis is configured — skipped entirely in local dev
        if (isRedisConfigured) {
            const userMightExist = await BloomFilter.exists('user_emails', email);
            if (!userMightExist) {
                throw ApiError.unauthorized('Invalid email or password');
            }
        }

        // Use Singleflight to coalesce concurrent login attempts for the same heavy user data fetching
        const user = await Singleflight.execute(`login_fetch:${email}`, async () => {
            // Sharded read: user lookup doesn't have a schoolId yet, so hits global shard
            return await getDb(undefined, { readOnly: true }).user.findUnique({
                where: { email },
                include: {
                    studentProfile: { select: { id: true } },
                    teacherProfile: { select: { id: true } },
                },
            });
        });

        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Check password
        const passwordValid = await bcrypt.compare(body.password, user.password);
        if (!passwordValid) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Redirect & Cookie
        const redirectUrl = getPortalUrl(user.role as any, user.schoolId ?? undefined);
        const jwtPayload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role as any,
            schoolId: user.schoolId ?? undefined,
            isActive: (user as any).isActive,
            teacherProfileId: user.teacherProfile?.id,
            studentProfileId: user.studentProfile?.id,
        };

        await loginUser(jwtPayload);

        const duration = (Date.now() - startTime) / 1000;
        recordHttpRequest('POST', '/api/auth/login', 200, duration);

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
        const duration = (Date.now() - startTime) / 1000;
        const status = err instanceof ApiError ? err.status : 500;
        recordHttpRequest('POST', '/api/auth/login', status, duration);
        recordError('LOGIN_ERROR', err instanceof Error ? err.message : String(err));

        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
