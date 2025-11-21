'use server';

import { deleteNotice } from '@/app/actions/notices';
import { redirect } from 'next/navigation';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ school_id: string; notice_id: string }> }
) {
    const { school_id, notice_id } = await params;

    await deleteNotice(notice_id, school_id);

    return new Response(null, { status: 200 });
}
