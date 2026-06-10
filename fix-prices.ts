import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.adminConfig.update({
    where: { id: 1 },
    data: {
      adultPriceEarlyBird: 50,
      kidsPriceEarlyBird: 25,
      adultPriceRegular: 80,
      kidsPriceRegular: 40,
    }
  });
  console.log("AdminConfig prices updated successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
