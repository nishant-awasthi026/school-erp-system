import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create Super Admin
    const superAdminEmail = 'admin@global.com';
    const superAdminPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {},
        create: {
            email: superAdminEmail,
            password: superAdminPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
        },
    });

    console.log({ superAdmin });

    // Create a Demo School
    const school = await prisma.school.create({
        data: {
            name: 'Demo International School',
            address: '123 Education Lane',
        },
    });

    console.log({ school });

    // Create School Admin
    const schoolAdminPassword = await bcrypt.hash('school123', 10);
    const schoolAdmin = await prisma.user.create({
        data: {
            email: 'admin@demo.school',
            password: schoolAdminPassword,
            name: 'Principal Skinner',
            role: 'SCHOOL_ADMIN',
            schoolId: school.id,
        },
    });

    console.log({ schoolAdmin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
