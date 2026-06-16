import prisma from './src/lib/prisma';

async function main() {
  try {
    await prisma.$executeRaw`ALTER TYPE "TemplateType" ADD VALUE 'ALLOCATED_TICKET'`;
    console.log("Enum updated successfully");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
