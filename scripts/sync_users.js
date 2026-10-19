const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('=== USERS IN DB ===');
  for (const u of users) {
    console.log(`- ${u.name} | ${u.email} | Role: ${u.role} | Approved: ${u.isApproved} | ID: ${u.id}`);
  }

  // Ensure known passwords for standard users:
  // 1. Admin: pankajsuryawanshi7764@gmail.com -> 9403496516
  // 2. Engineer: engineer@buildsmart.ai -> engineer123
  // 3. PM: pm@buildsmart.ai -> engineer123
  // 4. Client: client@buildsmart.ai -> client123
  const updates = [
    { email: 'pankajsuryawanshi7764@gmail.com', pass: '9403496516', role: 'ADMIN', name: 'Pankaj Suryawanshi (Executive Admin)', isApproved: true },
    { email: 'engineer@buildsmart.ai', pass: 'engineer123', role: 'ENGINEER', name: 'Rajesh Sharma (Lead Site Engineer)', isApproved: true },
    { email: 'pm@buildsmart.ai', pass: 'engineer123', role: 'ENGINEER', name: 'Sarah Connor (Senior PM)', isApproved: true },
    { email: 'client@buildsmart.ai', pass: 'client123', role: 'CLIENT', name: 'Vivek Patel (Client / Property Owner)', isApproved: true },
  ];

  for (const up of updates) {
    const hashed = await bcrypt.hash(up.pass, 10);
    const existing = await prisma.user.findUnique({ where: { email: up.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: up.email },
        data: { password: hashed, role: up.role, name: up.name, isApproved: true }
      });
      console.log(`Updated user: ${up.email} (Pass: ${up.pass})`);
    } else {
      await prisma.user.create({
        data: { email: up.email, password: hashed, role: up.role, name: up.name, isApproved: true }
      });
      console.log(`Created user: ${up.email} (Pass: ${up.pass})`);
    }
  }

  console.log('All user accounts verified & updated.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

