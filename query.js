const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const regs = await prisma.registration.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(regs);
}

main().finally(() => prisma.$disconnect());
