import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import { validate } from '@/lib/validate';
import { z } from 'zod';

const CollectFeeSchema = z.object({
    studentProfileId: z.string(),
    monthlyFeeId: z.string(),
    amount: z.number().positive(),
    method: z.enum(['CASH', 'ONLINE', 'CHEQUE', 'UPI', 'DEMAND_DRAFT']),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ school_id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !['SCHOOL_ADMIN', 'CASHIER'].includes(session.role)) throw ApiError.forbidden();
        await params;

        const body = validate(CollectFeeSchema, await request.json());

        const fee = await db.monthlyFee.findUnique({ where: { id: body.monthlyFeeId } });
        if (!fee) throw ApiError.notFound('Monthly fee record');

        const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
        const newPaid = fee.paidAmount + body.amount;
        const newStatus = newPaid >= fee.amount ? 'PAID' : 'PARTIAL';

        const [payment] = await db.$transaction([
            db.payment.create({
                data: {
                    receiptNumber, monthlyFeeId: body.monthlyFeeId,
                    amount: body.amount, paymentDate: new Date(), method: body.method,
                    collectedBy: session.userId,
                }
            }),
            db.monthlyFee.update({
                where: { id: body.monthlyFeeId },
                data: { paidAmount: newPaid, status: newStatus }
            }),
        ]);

        return NextResponse.json(successResponse({ payment, receiptNumber, newStatus }), { status: 201 });
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
