import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ApiError, errorResponse, successResponse } from '@/lib/errors';
import db from '@/lib/db';
import { parseCSV } from '@/lib/csvParser';
import bcrypt from 'bcryptjs';

interface ImportResult {
    row: number;
    name: string;
    email: string;
    status: 'success' | 'error';
    error?: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ school_id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SCHOOL_ADMIN') throw ApiError.forbidden();
        const { school_id } = await params;

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) throw ApiError.badRequest('No CSV file uploaded');

        const text = await file.text();
        const { rows, errors: parseErrors } = parseCSV(text);

        if (parseErrors.length > 0) {
            return NextResponse.json({ success: false, error: { message: parseErrors.join('; ') } }, { status: 422 });
        }

        // Load all existing classes and sections for this school for lookup
        const classes = await db.class.findMany({
            where: { schoolId: school_id },
            include: { sections: true },
        });
        const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c]));

        const results: ImportResult[] = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +2 for 1-indexed + header row

            const name = row['name']?.trim();
            const email = row['email']?.trim()?.toLowerCase();
            const password = row['password']?.trim();
            const className = row['class_name']?.trim()?.toLowerCase();
            const sectionName = row['section_name']?.trim()?.toLowerCase();

            // Basic validation
            if (!name || !email || !password) {
                results.push({ row: rowNum, name: name || '(blank)', email: email || '(blank)', status: 'error', error: 'name, email, and password are required' });
                failCount++;
                continue;
            }
            if (password.length < 6) {
                results.push({ row: rowNum, name, email, status: 'error', error: 'password must be at least 6 characters' });
                failCount++;
                continue;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                results.push({ row: rowNum, name, email, status: 'error', error: 'invalid email format' });
                failCount++;
                continue;
            }

            try {
                // Check if email already exists
                const existing = await db.user.findUnique({ where: { email } });
                if (existing) {
                    results.push({ row: rowNum, name, email, status: 'error', error: 'email already exists' });
                    failCount++;
                    continue;
                }

                // Resolve class + section
                const classRecord = className ? classMap.get(className) : null;
                const sectionRecord = classRecord && sectionName
                    ? classRecord.sections.find(s => s.name.toLowerCase() === sectionName)
                    : null;

                const hashedPwd = await bcrypt.hash(password, 10);

                await db.user.create({
                    data: {
                        name,
                        email,
                        password: hashedPwd,
                        role: 'STUDENT',
                        schoolId: school_id,
                        studentProfile: {
                            create: {
                                rollNumber: row['roll_number'] || undefined,
                                studentId: row['student_id'] || undefined,
                                classId: classRecord?.id,
                                sectionId: sectionRecord?.id,
                                fatherName: row['father_name'] || undefined,
                                motherName: row['mother_name'] || undefined,
                                guardianPhone: row['guardian_phone'] || undefined,
                                parentPhone: row['guardian_phone'] || undefined,
                                parentName: row['father_name'] || undefined,
                                dob: row['dob'] ? new Date(row['dob']) : undefined,
                                gender: row['gender'] || undefined,
                                category: row['category'] || undefined,
                                bloodGroup: row['blood_group'] || undefined,
                                address: row['address'] || undefined,
                            },
                        },
                    },
                });

                results.push({ row: rowNum, name, email, status: 'success' });
                successCount++;
            } catch (err) {
                results.push({ row: rowNum, name, email, status: 'error', error: (err as Error).message });
                failCount++;
            }
        }

        return NextResponse.json(successResponse({
            total: rows.length,
            successCount,
            failCount,
            results,
        }));
    } catch (err) {
        if (err instanceof ApiError) return NextResponse.json({ success: false, error: err.toJSON() }, { status: err.status });
        console.error('[students/import] error:', err);
        return NextResponse.json(errorResponse(err as Error), { status: 500 });
    }
}
