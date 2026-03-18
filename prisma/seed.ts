import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create Super Admin
    const superAdminEmail = 'admin@global.com';
    const superAdminPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: { password: superAdminPassword },
        create: {
            email: superAdminEmail,
            password: superAdminPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
        },
    });

    console.log('✅ Super Admin:', superAdmin.email);

    // Upsert a Demo School
    const school = await prisma.school.upsert({
        where: { id: 'demo-school-id' },
        update: {},
        create: {
            id: 'demo-school-id',
            name: 'Demo International School',
            address: '123 Education Lane',
        },
    });

    console.log('✅ School:', school.name);

    // Create School Admin
    const schoolAdminEmail = 'admin@demo.school';
    const schoolAdminPassword = await bcrypt.hash('school123', 10);

    const schoolAdmin = await prisma.user.upsert({
        where: { email: schoolAdminEmail },
        update: { password: schoolAdminPassword },
        create: {
            email: schoolAdminEmail,
            password: schoolAdminPassword,
            name: 'Principal Skinner',
            role: 'SCHOOL_ADMIN',
            schoolId: school.id,
        },
    });

    console.log('✅ School Admin:', schoolAdmin.email);
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('\n🎉 Demo credentials seeded successfully!');
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
