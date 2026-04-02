import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ schoolId: string }> }
) {
    const { schoolId } = await params;
    const user = await getCurrentUser();

    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const school = await db.school.findUnique({
            where: { id: schoolId },
            include: { config: true },
        });

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        let config = school.config;
        if (!config) {
            config = await db.schoolConfig.create({
                data: { schoolId },
            });
        }

        // Exclude the relations to just return scalar fields
        const { config: _, ...schoolData } = school;

        return NextResponse.json({ school: schoolData, config });
    } catch (error) {
        console.error('Failed to fetch config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ schoolId: string }> }
) {
    const { schoolId } = await params;
    const user = await getCurrentUser();
    const body = await request.json();

    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { school, config } = body;

    try {
        const transaction = [];

        if (school) {
            transaction.push(
                db.school.update({
                    where: { id: schoolId },
                    data: {
                        name: school.name,
                        logoUrl: school.logoUrl,
                        phone: school.phone,
                        board: school.board,
                        principalName: school.principalName,
                    },
                })
            );
        }

        if (config) {
            // Remove the id and schoolId from config if present to avoid updating primary keys
            const { id, schoolId: _, ...configData } = config;
            transaction.push(
                db.schoolConfig.update({
                    where: { schoolId },
                    data: configData,
                })
            );
        }

        await db.$transaction(transaction);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
