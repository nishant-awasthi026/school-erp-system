import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';
import { logAudit } from '@/lib/observability/audit';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') throw ApiError.forbidden();

        const { id } = await params;
        const school = await db.school.findUnique({ where: { id } });
        if (!school) throw ApiError.notFound('School');

        const updated = await db.school.update({
            where: { id },
            data: { isActive: !school.isActive },
        });

        logAudit({
            actorId: session.userId,
            actorRole: session.role,
            tenantId: id,
            action: updated.isActive ? 'ACTIVATE' : 'SUSPEND',
            entity: 'School',
            entityId: id,
            before: { isActive: school.isActive },
            after: { isActive: updated.isActive },
        });

        return NextResponse.json(successResponse({ isActive: updated.isActive, schoolId: id }));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
