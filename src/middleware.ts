import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    console.log(`Middleware: ${pathname}, Token: ${token ? 'Present' : 'Missing'}`);

    // Public routes
    if (pathname === '/' || pathname.startsWith('/api/login') || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
        return NextResponse.next();
    }

    // Verify token
    if (!token) {
        console.log('Middleware: No token, redirecting to /');
        return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
        console.log('Middleware: Invalid token, redirecting to /');
        return NextResponse.redirect(new URL('/', request.url));
    }

    console.log(`Middleware: Authorized as ${payload.role}`);

    // Role-based protection
    if (pathname.startsWith('/dashboard/super-admin')) {
        if (payload.role !== 'SUPER_ADMIN') {
            console.log('Middleware: Access denied for Super Admin route');
            return NextResponse.redirect(new URL('/dashboard', request.url)); // Or 403 page
        }
    }

    // Tenant isolation check (Basic)
    // If the path contains a school ID, check if the user belongs to that school
    // This is a simplified check; robust check would parse the ID from URL

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
