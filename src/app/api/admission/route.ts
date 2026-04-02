import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { schoolId, studentName, parentName, parentEmail, parentPhone, targetClass, previousSchool, message } = body;

        if (!schoolId || !studentName || !parentName || !parentPhone) {
            return NextResponse.json({ 
                success: false, 
                error: { message: 'Required fields missing' } 
            }, { status: 400 });
        }

        // Verify school exists
        const school = await db.school.findUnique({ where: { id: schoolId } });
        if (!school) {
            return NextResponse.json({ 
                success: false, 
                error: { message: 'Invalid school ID' } 
            }, { status: 404 });
        }

        // Create a 'Prospective' Student Profile
        // Note: A prospective student doesn't have a 'User' (auth) yet.
        // We will create the User only after approval.
        // However, StudentProfile in our schema requires a userId.
        
        // Option 1: Create a placeholder User (no password login)
        // Option 2: Store in a separate 'AdmissionApplication' table (requires schema change)
        
        // For now, since we already updated schema for admissionStatus,
        // we will create a User with a placeholder password and status='APPLIED'
        const temporaryEmail = `temp_${Date.now()}@${schoolId}.applied`;
        
        const result = await db.user.create({
            data: {
                email: parentEmail || temporaryEmail,
                password: 'placeholder_not_for_login',
                name: studentName,
                role: 'STUDENT',
                schoolId: schoolId,
                studentProfile: {
                    create: {
                        parentName,
                        parentPhone,
                        admissionStatus: 'APPLIED',
                        isActive: false, // Not a full student yet
                        address: message, // Use address field for message for now or add a message field
                    }
                }
            }
        });

        // Log the activity
        await db.activityLog.create({
            data: {
                action: 'ADMISSION_APPLIED',
                performedBy: 'PUBLIC',
                schoolId: schoolId,
                targetId: result.id,
                targetType: 'STUDENT',
                metadata: JSON.stringify({ studentName, parentName, targetClass })
            }
        });

        return NextResponse.json({ success: true, data: { applicantId: result.id } });

    } catch (error: any) {
        console.error('Admission API Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: { message: error.message || 'Internal Server Error' } 
        }, { status: 500 });
    }
}
