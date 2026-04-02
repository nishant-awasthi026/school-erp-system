import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Basic security for cron trigger
    if (key !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const results = {
            feesGenerated: 0,
            lateFeesApplied: 0,
            attendanceAlertsSent: 0,
        };

        // 0. GET ALL ACTIVE SCHOOLS
        const activeSchools = await db.school.findMany({ where: { isActive: true } });

        for (const school of activeSchools) {
            // 1. GENERATE MONTHLY FEES (On 1st day of month)
            if (now.getDate() === 1) {
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const monthName = now.toLocaleString('default', { month: 'long' });
                
                const students = await db.studentProfile.findMany({
                    where: { isActive: true, user: { schoolId: school.id } },
                    include: { class: { include: { feeStructure: true } } }
                });

                for (const student of students) {
                    if (!student.class?.feeStructure) continue;

                    const existing = await db.monthlyFee.findUnique({
                        where: { studentId_month: { studentId: student.id, month: currentMonth } }
                    });

                    if (!existing) {
                        await db.monthlyFee.create({
                            data: {
                                studentId: student.id,
                                month: currentMonth,
                                year: now.getFullYear(),
                                monthName: monthName,
                                amount: student.class.feeStructure.monthlyAmount,
                                dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
                                status: 'PENDING',
                            }
                        });
                        results.feesGenerated++;
                    }
                }
            }

            // 2. APPLY LATE FEES (On 11th day of month)
            if (now.getDate() === 11) {
                const overdueFees = await db.monthlyFee.findMany({
                    where: { 
                        status: 'PENDING', 
                        dueDate: { lt: now },
                        student: { user: { schoolId: school.id } }
                    },
                    include: { student: { include: { class: { include: { feeStructure: true } } } } }
                });

                for (const fee of overdueFees) {
                    const lateFee = fee.student.class?.feeStructure?.lateFeeAmount || 0;
                    if (lateFee > 0) {
                        await db.monthlyFee.update({
                            where: { id: fee.id },
                            data: {
                                amount: { increment: lateFee },
                                status: 'OVERDUE'
                            }
                        });
                        results.lateFeesApplied++;
                    }
                }
            }

            // 3. ATTENDANCE MONITORING (Daily)
            const dayOfWeek = now.getDay();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            const timetables = await db.timetable.findMany({
                where: { schoolId: school.id, dayOfWeek },
                include: { 
                    class: true, 
                    attendanceRecords: { 
                        where: { 
                            date: { gte: startOfDay, lt: endOfDay } 
                        } 
                    } 
                }
            });

            for (const slot of timetables) {
                if (slot.attendanceRecords.length === 0) {
                    // Record missing for today's slot
                    results.attendanceAlertsSent++;
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
