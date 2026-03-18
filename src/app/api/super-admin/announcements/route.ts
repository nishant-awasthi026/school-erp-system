import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';

const AnnouncementSchema = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    targetType: z.enum(['ALL', 'SCHOOL', 'CLASS']).default('ALL'),
    targetId: z.string().optional(),
});

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') throw ApiError.forbidden();

        const announcements = await db.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return NextResponse.json(successResponse(announcements));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') throw ApiError.forbidden();

        const body = validate(AnnouncementSchema, await request.json());

        const announcement = await db.announcement.create({
            data: { authorId: session.userId, ...body },
        });
        return NextResponse.json(successResponse(announcement), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
