import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling receiptUploadedAt...');
  
  // Find all registrations with a receiptUrl
  const regsWithReceipt1 = await prisma.registration.findMany({
    where: { receiptUrl: { not: null }, receiptUploadedAt: null },
    select: { id: true, updatedAt: true }
  });
  
  for (const reg of regsWithReceipt1) {
    await prisma.registration.update({
      where: { id: reg.id },
      data: { receiptUploadedAt: reg.updatedAt }
    });
  }
  console.log(`Updated ${regsWithReceipt1.length} registrations for receiptUrl.`);

  const regsWithReceipt2 = await prisma.registration.findMany({
    where: { receiptUrl2: { not: null }, receipt2UploadedAt: null },
    select: { id: true, updatedAt: true }
  });
  
  for (const reg of regsWithReceipt2) {
    await prisma.registration.update({
      where: { id: reg.id },
      data: { receipt2UploadedAt: reg.updatedAt }
    });
  }
  console.log(`Updated ${regsWithReceipt2.length} registrations for receiptUrl2.`);
  
  console.log('Backfill complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
