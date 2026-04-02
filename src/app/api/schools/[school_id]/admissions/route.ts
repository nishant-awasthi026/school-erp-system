import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ school_id: string }> }
) {
    try {
        const { school_id } = await params;
        
        const applications = await db.user.findMany({
            where: {
                schoolId: school_id,
                role: 'STUDENT',
                studentProfile: {
                    admissionStatus: 'APPLIED'
                }
            },
            include: {
                studentProfile: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ success: true, data: applications });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}
