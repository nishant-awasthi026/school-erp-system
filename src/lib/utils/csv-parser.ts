/**
 * Lightweight CSV parser — handles quoted fields, commas inside quotes, and trimming.
 * No external dependencies; works in Node.js and browser environments.
 */

export interface ParseResult {
    headers: string[];
    rows: Record<string, string>[];
    errors: string[];
}

/** Parse a CSV string into structured rows */
export function parseCSV(text: string): ParseResult {
    const errors: string[] = [];
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');

    if (lines.length < 2) {
        return { headers: [], rows: [], errors: ['CSV must have at least a header row and one data row.'] };
    }

    const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);

        if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
            continue;
        }

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx].trim(); });
        rows.push(row);
    }

    return { headers, rows, errors };
}

/** Parse a single CSV line respecting quoted fields */
function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'; i++; // escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

/** Generate a CSV string from headers + rows */
export function generateCSV(headers: string[], rows: Record<string, string>[]): string {
    const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    const headerRow = headers.map(escape).join(',');
    const dataRows = rows.map(row => headers.map(h => escape(row[h] ?? '')).join(','));
    return [headerRow, ...dataRows].join('\n');
}

// ─── Student template ────────────────────────────────────────────────────────

export const STUDENT_TEMPLATE_HEADERS = [
    'name', 'email', 'password', 'roll_number', 'student_id',
    'class_name', 'section_name',
    'father_name', 'mother_name', 'guardian_phone',
    'dob', 'gender', 'category', 'blood_group', 'address',
];

export const STUDENT_TEMPLATE_SAMPLE = [
    {
        name: 'Priya Sharma', email: 'priya.sharma@student.school.com', password: 'Student@123',
        roll_number: '001', student_id: 'STU-2025-001',
        class_name: '10', section_name: 'A',
        father_name: 'Rajesh Sharma', mother_name: 'Sunita Sharma', guardian_phone: '9876543210',
        dob: '2010-05-15', gender: 'FEMALE', category: 'GENERAL', blood_group: 'B+', address: '123 MG Road, Mumbai',
    },
    {
        name: 'Arjun Patel', email: 'arjun.patel@student.school.com', password: 'Student@123',
        roll_number: '002', student_id: 'STU-2025-002',
        class_name: '10', section_name: 'A',
        father_name: 'Kiran Patel', mother_name: 'Meena Patel', guardian_phone: '9876543211',
        dob: '2010-07-22', gender: 'MALE', category: 'OBC', blood_group: 'O+', address: '456 Park Street, Pune',
    },
];

// ─── Teacher template ────────────────────────────────────────────────────────

export const TEACHER_TEMPLATE_HEADERS = [
    'name', 'email', 'password', 'employee_id',
    'department', 'designation', 'qualification', 'experience_years',
    'salary', 'phone', 'subjects', 'date_of_joining',
];

export const TEACHER_TEMPLATE_SAMPLE = [
    {
        name: 'Dr. Anita Verma', email: 'anita.verma@school.com', password: 'Teacher@123',
        employee_id: 'EMP-001', department: 'Science', designation: 'Senior Teacher',
        qualification: 'M.Sc. Physics, B.Ed', experience_years: '8', salary: '55000',
        phone: '9123456789', subjects: 'Physics|Chemistry', date_of_joining: '2018-07-01',
    },
    {
        name: 'Mr. Suresh Kumar', email: 'suresh.kumar@school.com', password: 'Teacher@123',
        employee_id: 'EMP-002', department: 'Mathematics', designation: 'Teacher',
        qualification: 'M.Sc. Maths, B.Ed', experience_years: '5', salary: '45000',
        phone: '9234567890', subjects: 'Mathematics', date_of_joining: '2021-04-01',
    },
];
