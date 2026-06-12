import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  console.log(`Setting seatSecuredAt to yesterday (${yesterday.toISOString()}) for all SEAT_SECURED registrations...`);

  const result = await prisma.registration.updateMany({
    where: {
      status: 'SEAT_SECURED',
      seatSecuredAt: null
    },
    data: {
      seatSecuredAt: yesterday
    }
  });

  console.log(`Updated ${result.count} registrations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
