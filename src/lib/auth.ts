import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-key-change-this-in-production'
);

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
    CASHIER: 'CASHIER',
} as const;

export type Role = keyof typeof ROLES;

export interface JWTPayload {
    userId: string;
    email: string;
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
        .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<JWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
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
