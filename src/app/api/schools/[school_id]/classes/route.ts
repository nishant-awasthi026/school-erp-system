import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';

export async function GET(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(session.role)) throw ApiError.forbidden();
        const { school_id } = await params;

        const classes = await db.class.findMany({
            where: { schoolId: school_id },
            include: {
                sections: true,
                _count: { select: { students: true } },
            },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(successResponse(classes));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SCHOOL_ADMIN') throw ApiError.forbidden();
        const { school_id } = await params;

        const body = await request.json();
        const { name, sections: sectionNames } = body;
        if (!name) throw ApiError.badRequest('Class name is required');

        const cls = await db.class.create({
            data: {
                name, schoolId: school_id,
                sections: sectionNames?.length
                    ? { create: sectionNames.map((s: string) => ({ name: s })) }
                    : undefined,
            },
            include: { sections: true },
        });
        return NextResponse.json(successResponse(cls), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
