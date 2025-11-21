import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-key-change-this'
);

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
} as const;

export type Role = keyof typeof ROLES;

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    schoolId?: string; // Optional for Super Admin
    [key: string]: any; // Allow other claims
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function loginUser(payload: JWTPayload) {
    const token = await signToken(payload);
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
}
