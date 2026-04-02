import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * Verify teacher has access to a specific class/subject
 */
export async function verifyTeacherAccess(
    teacherId: string,
    classId?: string,
    subjectId?: string
): Promise<boolean> {
    const teacher = await db.teacherProfile.findUnique({
        where: { id: teacherId },
        include: {
            timetables: {
                where: {
                    ...(classId && { classId }),
                    ...(subjectId && { subjectId }),
                },
            },
        },
    });

    if (!teacher) return false;

    // Teacher must have at least one timetable slot for this class/subject
    return teacher.timetables.length > 0;
}

/**
 * Get teacher's assigned classes
 */
export async function getTeacherClasses(teacherId: string) {
    const timetables = await db.timetable.findMany({
        where: { teacherId },
        include: {
            class: true,
            section: true,
            subject: true,
        },
        distinct: ['classId', 'sectionId'],
    });

    const uniqueClasses = new Map();
    timetables.forEach(t => {
        const key = `${t.classId}-${t.sectionId || 'all'}`;
        if (!uniqueClasses.has(key)) {
            uniqueClasses.set(key, {
                class: t.class,
                section: t.section,
            });
        }
    });

    return Array.from(uniqueClasses.values());
}

/**
 * Get teacher's assigned subjects
 */
export async function getTeacherSubjects(teacherId: string) {
    const timetables = await db.timetable.findMany({
        where: { teacherId },
        include: {
            subject: true,
        },
        distinct: ['subjectId'],
    });

    return timetables.map(t => t.subject);
}

/**
 * Verify teacher can take attendance for a specific timetable slot
 */
export async function canTeacherTakeAttendance(
    teacherId: string,
    timetableId: string
): Promise<boolean> {
    const timetable = await db.timetable.findFirst({
        where: {
            id: timetableId,
            teacherId,
        },
    });

    return !!timetable;
}
