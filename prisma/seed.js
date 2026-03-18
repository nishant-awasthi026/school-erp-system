const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Super Admin
  const superAdmin = await db.user.upsert({
    where: { email: 'admin@schoolerp.com' },
    update: {},
    create: {
      email: 'admin@schoolerp.com',
      password: await bcrypt.hash('Admin@123', 10),
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Demo School
  const school = await db.school.upsert({
    where: { id: 'school-demo-001' },
    update: {},
    create: {
      id: 'school-demo-001',
      name: 'Demo Public School',
      address: '123 Education Lane, Mumbai, Maharashtra',
      phone: '9876543210',
      board: 'CBSE',
      principalName: 'Dr. Priya Sharma',
      academicYearStart: new Date('2025-04-01'),
      academicYearEnd: new Date('2026-03-31'),
    },
  });
  console.log('✅ School created:', school.name);

  // 3. School Admin
  const schoolAdmin = await db.user.upsert({
    where: { email: 'schooladmin@demo.com' },
    update: {},
    create: {
      email: 'schooladmin@demo.com',
      password: await bcrypt.hash('School@123', 10),
      name: 'School Administrator',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });
  console.log('✅ School Admin created:', schoolAdmin.email);

  // 4. Class 10-A
  const class10 = await db.class.upsert({
    where: { id: 'class-10-demo' },
    update: {},
    create: {
      id: 'class-10-demo',
      name: '10',
      schoolId: school.id,
    },
  });

  const sectionA = await db.section.upsert({
    where: { id: 'section-10a-demo' },
    update: {},
    create: {
      id: 'section-10a-demo',
      name: 'A',
      classId: class10.id,
    },
  });

  // 5. Subject
  const mathSubject = await db.subject.upsert({
    where: { id: 'subject-math-demo' },
    update: {},
    create: {
      id: 'subject-math-demo',
      name: 'Mathematics',
      code: 'MATH-10',
      schoolId: school.id,
    },
  });

  const sciSubject = await db.subject.upsert({
    where: { id: 'subject-sci-demo' },
    update: {},
    create: {
      id: 'subject-sci-demo',
      name: 'Science',
      code: 'SCI-10',
      schoolId: school.id,
    },
  });

  // 6. Teacher
  const teacherUser = await db.user.upsert({
    where: { email: 'teacher@demo.com' },
    update: {},
    create: {
      email: 'teacher@demo.com',
      password: await bcrypt.hash('Teacher@123', 10),
      name: 'Ramesh Kumar',
      role: 'TEACHER',
      schoolId: school.id,
    },
  });

  const teacherProfile = await db.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeId: 'EMP-001',
      department: 'Academic',
      designation: 'Senior Teacher',
      qualification: 'M.Sc Mathematics',
      experience: 8,
      salary: 45000,
    },
  });

  // Assign teacher to subject and class
  await db.subject.update({
    where: { id: mathSubject.id },
    data: { teacherId: teacherProfile.id },
  });

  await db.class.update({
    where: { id: class10.id },
    data: { teacherId: teacherProfile.id },
  });

  console.log('✅ Teacher created:', teacherUser.email);

  // 7. Timetable - Monday Math
  await db.timetable.upsert({
    where: {
      teacherId_classId_sectionId_subjectId_dayOfWeek_startTime: {
        teacherId: teacherProfile.id,
        classId: class10.id,
        sectionId: sectionA.id,
        subjectId: mathSubject.id,
        dayOfWeek: 1,
        startTime: '09:00',
      },
    },
    update: {},
    create: {
      teacherId: teacherProfile.id,
      classId: class10.id,
      sectionId: sectionA.id,
      subjectId: mathSubject.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '09:45',
      roomNumber: 'Room 101',
      schoolId: school.id,
    },
  });

  // 8. Student 1
  const studentUser1 = await db.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: {
      email: 'student@demo.com',
      password: await bcrypt.hash('Student@123', 10),
      name: 'Priya Patel',
      role: 'STUDENT',
      schoolId: school.id,
    },
  });

  await db.studentProfile.upsert({
    where: { userId: studentUser1.id },
    update: {},
    create: {
      userId: studentUser1.id,
      studentId: 'DPS-2025-001',
      rollNumber: '1',
      classId: class10.id,
      sectionId: sectionA.id,
      dob: new Date('2010-05-15'),
      gender: 'FEMALE',
      category: 'GENERAL',
      bloodGroup: 'O+',
      fatherName: 'Rajesh Patel',
      motherName: 'Sunita Patel',
      guardianPhone: '9876543211',
      parentName: 'Rajesh Patel',
      parentPhone: '9876543211',
      address: '456 Student Lane, Mumbai',
    },
  });
  console.log('✅ Student 1 created:', studentUser1.email);

  // 9. Student 2
  const studentUser2 = await db.user.upsert({
    where: { email: 'student2@demo.com' },
    update: {},
    create: {
      email: 'student2@demo.com',
      password: await bcrypt.hash('Student@123', 10),
      name: 'Arjun Singh',
      role: 'STUDENT',
      schoolId: school.id,
    },
  });

  await db.studentProfile.upsert({
    where: { userId: studentUser2.id },
    update: {},
    create: {
      userId: studentUser2.id,
      studentId: 'DPS-2025-002',
      rollNumber: '2',
      classId: class10.id,
      sectionId: sectionA.id,
      dob: new Date('2010-08-22'),
      gender: 'MALE',
      category: 'OBC',
      bloodGroup: 'A+',
      fatherName: 'Vikram Singh',
      motherName: 'Kavya Singh',
      guardianPhone: '9876543212',
      parentName: 'Vikram Singh',
      parentPhone: '9876543212',
      address: '789 Harmony Road, Mumbai',
    },
  });
  console.log('✅ Student 2 created:', studentUser2.email);

  // 10. Fee Structure
  await db.feeStructure.upsert({
    where: { classId: class10.id },
    update: {},
    create: {
      classId: class10.id,
      monthlyAmount: 5000,
      components: JSON.stringify([
        { name: 'Tuition Fee', amount: 3500 },
        { name: 'Library Fee', amount: 500 },
        { name: 'Sports Fee', amount: 500 },
        { name: 'Lab Fee', amount: 500 },
      ]),
      lateFeeType: 'FLAT',
      lateFeeAmount: 100,
      schoolId: school.id,
    },
  });

  // 11. Sample Monthly Fee records for current month
  const studentProfile1 = await db.studentProfile.findUnique({ where: { userId: studentUser1.id } });
  const studentProfile2 = await db.studentProfile.findUnique({ where: { userId: studentUser2.id } });

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleString('default', { month: 'long' });

  if (studentProfile1) {
    await db.monthlyFee.upsert({
      where: { studentId_month: { studentId: studentProfile1.id, month: monthKey } },
      update: {},
      create: {
        studentId: studentProfile1.id,
        month: monthKey,
        year: now.getFullYear(),
        monthName,
        amount: 5000,
        paidAmount: 0,
        status: 'PENDING',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
    });
  }

  if (studentProfile2) {
    await db.monthlyFee.upsert({
      where: { studentId_month: { studentId: studentProfile2.id, month: monthKey } },
      update: {},
      create: {
        studentId: studentProfile2.id,
        month: monthKey,
        year: now.getFullYear(),
        monthName,
        amount: 5000,
        paidAmount: 5000,
        status: 'PAID',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
    });
  }

  // 12. Sample Homework
  if (teacherProfile) {
    await db.homework.upsert({
      where: { id: 'hw-demo-001' },
      update: {},
      create: {
        id: 'hw-demo-001',
        title: 'Algebra Practice Set 1',
        description: 'Solve exercises 1-20 from Chapter 3: Linear Equations. Show all working steps.',
        teacherId: teacherProfile.id,
        classId: class10.id,
        sectionId: sectionA.id,
        subjectId: mathSubject.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        schoolId: school.id,
      },
    });
  }

  // 13. Sample Announcement
  await db.announcement.upsert({
    where: { id: 'ann-demo-001' },
    update: {},
    create: {
      id: 'ann-demo-001',
      authorId: schoolAdmin.id,
      title: 'Annual Sports Day — April 15th',
      body: 'Dear Parents and Students, We are pleased to announce our Annual Sports Day on April 15th, 2025. All students are requested to report by 8:00 AM in their sports attire. Parents are welcome to attend.',
      targetType: 'ALL',
      schoolId: school.id,
    },
  });

  // 14. Library Books
  const books = [
    { id: 'book-001', title: 'Mathematics — Class 10 (NCERT)', author: 'NCERT', isbn: '9788174506801', category: 'Textbook', totalCopies: 5, available: 5 },
    { id: 'book-002', title: 'Science — Class 10 (NCERT)', author: 'NCERT', isbn: '9788174506818', category: 'Textbook', totalCopies: 5, available: 4 },
    { id: 'book-003', title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '9788173711466', category: 'Biography', totalCopies: 3, available: 2 },
  ];
  for (const book of books) {
    await db.libraryBook.upsert({
      where: { id: book.id },
      update: {},
      create: { ...book, schoolId: school.id },
    });
  }

  // 15. Transport Route
  const route = await db.transportRoute.upsert({
    where: { id: 'route-demo-001' },
    update: {},
    create: {
      id: 'route-demo-001',
      schoolId: school.id,
      name: 'Route A — Andheri to School',
      stops: JSON.stringify([
        { name: 'Andheri West', time: '07:00', feeAmount: 1500 },
        { name: 'Versova', time: '07:15', feeAmount: 1300 },
        { name: 'DN Nagar', time: '07:25', feeAmount: 1100 },
        { name: 'School', time: '08:00', feeAmount: 0 },
      ]),
    },
  });

  await db.vehicle.upsert({
    where: { id: 'vehicle-demo-001' },
    update: {},
    create: {
      id: 'vehicle-demo-001',
      schoolId: school.id,
      routeId: route.id,
      registrationNumber: 'MH-01-AA-1234',
      driverName: 'Mahesh Yadav',
      driverPhone: '9876500001',
      capacity: 40,
      fitnessExpiry: new Date('2026-03-31'),
    },
  });

  // 16. ActivityLog entry
  await db.activityLog.create({
    data: {
      action: 'CREATE:School:school-demo-001',
      performedBy: superAdmin.id,
      targetId: school.id,
      targetType: 'School',
      metadata: JSON.stringify({ actorRole: 'SUPER_ADMIN' }),
      schoolId: school.id,
    },
  });

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo login credentials:');
  console.log('  Super Admin: admin@schoolerp.com    / Admin@123');
  console.log('  School Admin: schooladmin@demo.com  / School@123');
  console.log('  Teacher:      teacher@demo.com       / Teacher@123');
  console.log('  Student 1:   student@demo.com        / Student@123');
  console.log('  Student 2:   student2@demo.com       / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
