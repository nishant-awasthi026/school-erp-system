import { SignJWT, jwtVerify } from 'jose';

export const secret = new TextEncoder().encode(
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
    isActive?: boolean;
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
