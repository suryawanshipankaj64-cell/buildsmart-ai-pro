const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isApproved: true }
  });
  console.log('=== USERS ===');
  console.log(JSON.stringify(users, null, 2));

  const projects = await prisma.project.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      expenses: true,
      tasks: true,
      sitePhotos: true,
    }
  });
  console.log('=== PROJECTS ===');
  console.log(JSON.stringify(projects.map(p => ({
    id: p.id,
    name: p.name,
    location: p.location,
    budget: p.budget,
    progressPercent: p.progressPercent,
    status: p.status,
    userId: p.userId,
    ownerName: p.user?.name,
    ownerEmail: p.user?.email,
    ownerRole: p.user?.role,
    expensesCount: p.expenses?.length,
    tasksCount: p.tasks?.length,
    sitePhotosCount: p.sitePhotos?.length,
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

