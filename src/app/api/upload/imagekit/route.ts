import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import { getSession } from '@/lib/auth';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        // Generate a unique file name
        const uniqueKey = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Ensure env variables are set
        if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
            return NextResponse.json({ success: false, error: 'ImageKit environment variables are missing' }, { status: 500 });
        }

        // Convert the File out of the form data into a buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: buffer, 
            fileName: uniqueKey,
            folder: `/profiles/${session.userId}`
        });
        
        // Return the final public URL to access the uploaded file
        return NextResponse.json({
            success: true,
            publicUrl: uploadResponse.url
        });

    } catch (err: any) {
        console.error('[upload/imagekit] POST error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
