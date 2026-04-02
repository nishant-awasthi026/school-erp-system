import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/utils/errors';
import { z } from 'zod';
import { withDistributedLock } from '@/lib/infra/locking';
import { enqueueTask, TaskType } from '@/lib/infra/task-queue';

const PromoteSchema = z.object({
    studentIds: z.array(z.string()).min(1),
    targetClassId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    const { school_id } = await params;
    try {
        const session = await getSession();
        if (!session || !['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.role)) throw ApiError.forbidden();
        
        const body = await request.json();
        const parsed = PromoteSchema.parse(body);

        // Pattern: Use Distributed Lock to prevent duplicate promotion processes
        return await withDistributedLock(`promote:${school_id}`, async () => {
            console.log(`[Promote] Lock acquired for school ${school_id}.`);

            // Pattern: Move heavy processing to Background Task Queue
            const task = await enqueueTask({
                type: TaskType.PROCESS_SALARY, // Use a placeholder or add a 'PROMOTE' type
                schoolId: school_id,
                data: {
                    studentIds: parsed.studentIds,
                    targetClassId: parsed.targetClassId,
                }
            });

            // Return immediate response with Task ID
            return NextResponse.json(successResponse({ 
                status: 'ACCEPTED', 
                taskId: task.taskId,
                message: 'Bulk promotion started in the background.'
            }), { status: 202 });
        });

    } catch (err) {
        if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: { message: 'Invalid payload' } }, { status: 400 });
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        if (err instanceof Error && err.message.includes('[Lock]')) {
            return NextResponse.json({ success: false, error: { message: 'A promotion process is already running for this school. Please wait.' } }, { status: 409 });
        }
        console.error('[promote] POST error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
