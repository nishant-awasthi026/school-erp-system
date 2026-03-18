import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Role guard matrix — who can access what path prefix
const ROLE_GUARDS: Array<{ prefix: string; requiredRole: string; apiRoute: boolean }> = [
    { prefix: '/dashboard/super-admin', requiredRole: 'SUPER_ADMIN', apiRoute: false },
    { prefix: '/dashboard/student',     requiredRole: 'STUDENT',     apiRoute: false },
    { prefix: '/dashboard/teacher',     requiredRole: 'TEACHER',     apiRoute: false },
    { prefix: '/api/super-admin',       requiredRole: 'SUPER_ADMIN', apiRoute: true },
    { prefix: '/api/teacher',           requiredRole: 'TEACHER',     apiRoute: true },
    { prefix: '/api/student',           requiredRole: 'STUDENT',     apiRoute: true },
];

// Public routes that require no auth
const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/auth/logout', '/api/health'];

function isPublic(pathname: string): boolean {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '?'));
}

function isStaticAsset(pathname: string): boolean {
    return (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.jpg')
    );
}

function jsonUnauthorized(message: string) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}

function jsonForbidden(message: string) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always pass static assets and public paths
    if (isStaticAsset(pathname) || isPublic(pathname)) {
        return NextResponse.next();
    }

    // Extract token from HttpOnly cookie
    const token = request.cookies.get('token')?.value;

    // No token — redirect to login or return 401
    if (!token) {
        if (pathname.startsWith('/api/')) {
            return jsonUnauthorized('Authentication required');
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Verify JWT
    const payload = await verifyToken(token);
    if (!payload) {
        if (pathname.startsWith('/api/')) {
            return jsonUnauthorized('Invalid or expired token');
        }
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('token');
        return response;
    }

    const { role, schoolId } = payload;

    // Apply role guard matrix
    for (const guard of ROLE_GUARDS) {
        if (pathname.startsWith(guard.prefix)) {
            if (role !== guard.requiredRole) {
                if (guard.apiRoute) {
                    return jsonForbidden(`${guard.requiredRole} role required`);
                }
                // Redirect to correct portal
                const portalMap: Record<string, string> = {
                    SUPER_ADMIN: '/dashboard/super-admin',
                    SCHOOL_ADMIN: schoolId ? `/dashboard/${schoolId}` : '/',
                    TEACHER: '/dashboard/teacher',
                    STUDENT: '/dashboard/student',
                };
                return NextResponse.redirect(new URL(portalMap[role] || '/', request.url));
            }
        }
    }

    // School Admin path — verify school ownership
    // /dashboard/[school_id]/* — ensure the schoolId in URL matches JWT
    const schoolPathMatch = pathname.match(/^\/dashboard\/([^/]+)/);
    if (schoolPathMatch) {
        const urlSchoolId = schoolPathMatch[1];
        // Skip this check for named portals like super-admin, teacher, student
        const namedPortals = ['super-admin', 'teacher', 'student'];
        if (!namedPortals.includes(urlSchoolId)) {
            if (role === 'SCHOOL_ADMIN' && schoolId && schoolId !== urlSchoolId) {
                return NextResponse.redirect(new URL(`/dashboard/${schoolId}`, request.url));
            }
            // Non-admin roles shouldn't access /dashboard/[school_id]
            if (role === 'TEACHER' || role === 'STUDENT') {
                const redirect = role === 'TEACHER' ? '/dashboard/teacher' : '/dashboard/student';
                return NextResponse.redirect(new URL(redirect, request.url));
            }
        }
    }

    // School Admin API routes — check schoolId from URL
    const schoolApiMatch = pathname.match(/^\/api\/schools\/([^/]+)/);
    if (schoolApiMatch) {
        const urlSchoolId = schoolApiMatch[1];
        if (role !== 'SUPER_ADMIN' && role !== 'SCHOOL_ADMIN') {
            return jsonForbidden('School admin role required');
        }
        if (role === 'SCHOOL_ADMIN' && schoolId && schoolId !== urlSchoolId) {
            return jsonForbidden('Access denied to this school');
        }
    }

    // Inject request ID for log correlation
    const requestId = crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', role);
    if (schoolId) requestHeaders.set('x-school-id', schoolId);

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
