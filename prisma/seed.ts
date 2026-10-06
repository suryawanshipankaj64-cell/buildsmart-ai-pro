import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing clean production database (User accounts & rates only, 0 dummy projects)...');

  // 1. Password Hashes
  const adminPass = await bcrypt.hash('9403496516', 10);
  const pmPass = await bcrypt.hash('pm123', 10);
  const engPass = await bcrypt.hash('engineer123', 10);
  const clientPass = await bcrypt.hash('client123', 10);

  // 2. Seed Clean Authentication Accounts with Distinct Roles
  const admin = await prisma.user.upsert({
    where: { email: 'pankajsuryawanshi7764@gmail.com' },
    update: { password: adminPass, role: 'ADMIN', isApproved: true },
    create: {
      email: 'pankajsuryawanshi7764@gmail.com',
      name: 'Pankaj Suryawanshi (Executive Admin)',
      password: adminPass,
      role: 'ADMIN',
      isApproved: true,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@buildsmart.ai' },
    update: { password: pmPass, role: 'USER', isApproved: true },
    create: {
      email: 'pm@buildsmart.ai',
      name: 'Sarah Connor (Senior PM)',
      password: pmPass,
      role: 'USER',
      isApproved: true,
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@buildsmart.ai' },
    update: { password: engPass, role: 'ENGINEER', isApproved: true },
    create: {
      email: 'engineer@buildsmart.ai',
      name: 'Rajesh Sharma (Lead Site Engineer)',
      password: engPass,
      role: 'ENGINEER',
      isApproved: true,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@buildsmart.ai' },
    update: { password: clientPass, role: 'CLIENT', isApproved: true },
    create: {
      email: 'client@buildsmart.ai',
      name: 'Client / Owner Account',
      password: clientPass,
      role: 'CLIENT',
      isApproved: true,
    },
  });

  // 3. Seed Default Admin Baseline Rates & Settings
  await prisma.adminSetting.deleteMany();
  await prisma.adminSetting.create({
    data: {
      isSiteLocked: false,
      baseRatePerSqFt: 1800,
      standardRatePerSqFt: 1800,
      premiumRatePerSqFt: 2200,
      luxuryRatePerSqFt: 3100,
      cementBagRate: 380,
      steelKgRate: 65,
      sandCftRate: 55,
      aggregateCftRate: 42,
      brickRate: 9,
      masonDailyWage: 950,
      helperDailyWage: 550,
    },
  });

  // 4. Wipe All Dummy / Sample Data (Projects, Tasks, Expenses, Photos, Logs)
  await prisma.sitePhoto.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.task.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.changeLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.project.deleteMany();

  console.log('Database successfully cleaned! All dummy projects removed.');
  console.log('---------------------------------------------------------');
  console.log('Ready for new live data from users:');
  console.log('Master Admin:     pankajsuryawanshi7764@gmail.com / 9403496516 (Full Access)');
  console.log('Site Engineer:    engineer@buildsmart.ai         / engineer123 (Field Operations)');
  console.log('Client Account:   client@buildsmart.ai           / client123 (Owner Access)');
  console.log('Project Manager:  pm@buildsmart.ai               / pm123');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });