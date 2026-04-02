import { cookies } from 'next/headers';
import db from '@/lib/db';
import { signToken, verifyToken, JWTPayload, Role, ROLES } from '@/lib/auth/jwt';

export { signToken, verifyToken, ROLES };
export type { JWTPayload, Role };

export async function getSession(): Promise<JWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

/** 
 * Strict session validation that hits the database wrapper to ensure 
 * the role hasn't changed since the JWT was issued. Use for sensitive actions.
 */
export async function validateSession(): Promise<JWTPayload | null> {
    const session = await getSession();
    if (!session) return null;
    
    // Check DB for role changes to invalidate session
    try {
        const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
        if (!user || user.role !== session.role) {
            await logoutUser();
            return null; // Session invalid
        }
    } catch {
        return null;
    }
    
    return session;
}

/** Alias for server components */
export const getCurrentUser = getSession;

export async function loginUser(payload: JWTPayload) {
    const token = await signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
    return token;
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
}

/** Redirect URLs per role */
export function getPortalUrl(role: Role, schoolId?: string): string {
    switch (role) {
        case 'SUPER_ADMIN': return '/dashboard/super-admin';
        case 'SCHOOL_ADMIN': return `/dashboard/${schoolId}`;
        case 'TEACHER': return '/dashboard/teacher';
        case 'STUDENT': return '/dashboard/student';
        case 'CASHIER': return `/dashboard/${schoolId}/finance`;
        default: return '/';
    }
}
