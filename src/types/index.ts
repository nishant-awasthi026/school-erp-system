export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
} as const;

export type Role = keyof typeof ROLES;

export const ATTENDANCE_STATUS = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    MEDICAL_LEAVE: 'MEDICAL_LEAVE',
    ON_DUTY: 'ON_DUTY',
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;
