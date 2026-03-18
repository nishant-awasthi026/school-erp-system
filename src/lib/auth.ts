import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
<<<<<<< HEAD
    process.env.JWT_SECRET || 'super-secret-key-change-this-in-production'
=======
    process.env.JWT_SECRET || 'super-secret-key-change-this'
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
);

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
<<<<<<< HEAD
    CASHIER: 'CASHIER',
=======
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
} as const;

export type Role = keyof typeof ROLES;

export interface JWTPayload {
    userId: string;
    email: string;
<<<<<<< HEAD
    name: string;
    role: Role;
    schoolId?: string;
    teacherProfileId?: string;
    studentProfileId?: string;
    [key: string]: unknown;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
=======
    role: Role;
    schoolId?: string; // Optional for Super Admin
    [key: string]: any; // Allow other claims
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
        .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
<<<<<<< HEAD
    } catch {
=======
    } catch (error) {
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
        return null;
    }
}

<<<<<<< HEAD
export async function getSession(): Promise<JWTPayload | null> {
=======
export async function getSession() {
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

<<<<<<< HEAD
/** Alias for server components */
export const getCurrentUser = getSession;

=======
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
export async function loginUser(payload: JWTPayload) {
    const token = await signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
<<<<<<< HEAD
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
    return token;
=======
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
}
<<<<<<< HEAD

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
=======
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
