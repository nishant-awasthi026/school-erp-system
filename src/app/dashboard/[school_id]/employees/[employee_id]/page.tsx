import db from '@/lib/db';
import { notFound } from 'next/navigation';
import EmployeeDetail from './EmployeeDetail';

interface PageProps {
    params: Promise<{ school_id: string; employee_id: string }>;
}

async function getEmployee(employeeId: string, schoolId: string) {
    const employee = await db.user.findUnique({
        where: { id: employeeId },
        include: {
            teacherProfile: true,
        },
    });

    if (!employee || employee.schoolId !== schoolId) {
        return null;
    }

    return employee;
}

export default async function EmployeeDetailPage({ params }: PageProps) {
    const { school_id, employee_id } = await params;

    const employee = await getEmployee(employee_id, school_id);
    if (!employee) {
        notFound();
    }

    return <EmployeeDetail employee={employee} schoolId={school_id} />;
}
