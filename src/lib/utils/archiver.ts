import { getDb } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

/**
 * Cold Storage Archiver
 * Moves old records to flat files to keep the main DB lean.
 */
export class Archiver {
  /**
   * Archives ActivityLogs older than a certain date for a specific school.
   */
  static async archiveLogs(schoolId: string, olderThan: Date) {
    const db = getDb(schoolId);
    
    // 1. Fetch old logs
    const oldLogs = await db.activityLog.findMany({
      where: {
        schoolId,
        createdAt: { lt: olderThan },
      },
    });

    if (oldLogs.length === 0) return { archived: 0 };

    // 2. Prepare Cold Storage directory
    const archiveDir = path.join(process.cwd(), 'archives', schoolId, 'logs');
    await fs.mkdir(archiveDir, { recursive: true });

    const fileName = `logs_${olderThan.toISOString().split('T')[0]}.json`;
    const filePath = path.join(archiveDir, fileName);

    // 3. Write to Cold Storage (B2/S3 would be better in prod)
    await fs.writeFile(filePath, JSON.stringify(oldLogs, null, 2));

    // 4. Delete from Main DB
    const { count } = await db.activityLog.deleteMany({
      where: {
        id: { in: oldLogs.map(l => l.id) },
      },
    });

    console.log(`[Archiver] Successfully archived ${count} logs for school ${schoolId} to ${fileName}`);
    return { archived: count, file: filePath };
  }

  /**
   * Archives Attendance Records for the previous academic year.
   */
  static async archiveAttendance(schoolId: string, year: number) {
    const db = getDb(schoolId);
    
    // Similar logic for attendance...
    // In a real ERP, this would be triggered by an 'Academic Year Rollover' event.
  }
}
