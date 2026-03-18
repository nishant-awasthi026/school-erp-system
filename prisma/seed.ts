import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create Super Admin
    const superAdminEmail = 'admin@global.com';
    const superAdminPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
<<<<<<< HEAD
        update: { password: superAdminPassword },
=======
        update: {},
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
        create: {
            email: superAdminEmail,
            password: superAdminPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
        },
    });

<<<<<<< HEAD
    console.log('✅ Super Admin:', superAdmin.email);

    // Upsert a Demo School
    const school = await prisma.school.upsert({
        where: { id: 'demo-school-id' },
        update: {},
        create: {
            id: 'demo-school-id',
=======
    console.log({ superAdmin });

    // Create a Demo School
    const school = await prisma.school.create({
        data: {
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
            name: 'Demo International School',
            address: '123 Education Lane',
        },
    });

<<<<<<< HEAD
    console.log('✅ School:', school.name);

    // Create School Admin
    const schoolAdminEmail = 'admin@demo.school';
    const schoolAdminPassword = await bcrypt.hash('school123', 10);

    const schoolAdmin = await prisma.user.upsert({
        where: { email: schoolAdminEmail },
        update: { password: schoolAdminPassword },
        create: {
            email: schoolAdminEmail,
=======
    console.log({ school });

    // Create School Admin
    const schoolAdminPassword = await bcrypt.hash('school123', 10);
    const schoolAdmin = await prisma.user.create({
        data: {
            email: 'admin@demo.school',
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
            password: schoolAdminPassword,
            name: 'Principal Skinner',
            role: 'SCHOOL_ADMIN',
            schoolId: school.id,
        },
    });

<<<<<<< HEAD
    console.log('✅ School Admin:', schoolAdmin.email);
=======
    console.log({ schoolAdmin });
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
}

main()
    .then(async () => {
        await prisma.$disconnect();
<<<<<<< HEAD
        console.log('\n🎉 Demo credentials seeded successfully!');
=======
>>>>>>> 0813e6978b8b820f2cfebb45b1f99f99b28f8c72
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
