import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const regs = await prisma.registration.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(regs, null, 2));
}

main().finally(() => prisma.$disconnect());
