import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.registration.findMany({
    where: {
      adultTickets: 0,
      kidsTickets: 0,
      totalAmount: { gt: 0 }
    },
    include: {
      tickets: true
    }
  });

  console.log(`Found ${registrations.length} registrations to fix.`);

  let fixedCount = 0;

  for (const reg of registrations) {
    const amount = Number(reg.totalAmount);
    let adults = 0;
    let kids = 0;

    // Guessing logic based on standard RM 50 for adult and RM 25 for kids
    if (amount % 50 === 0) {
      adults = amount / 50;
    } else if (amount % 25 === 0) {
      // It could be a mix. E.g., 75 = 1 adult + 1 kid
      const remaining = amount % 50; // 25
      adults = Math.floor(amount / 50);
      kids = remaining / 25;
    } else {
      console.log(`Could not guess tickets for order ${reg.orderNumber} with amount ${amount}`);
      continue;
    }

    console.log(`Order ${reg.orderNumber} (RM ${amount}) -> ${adults} Adult, ${kids} Kids`);

    await prisma.$transaction(async (tx) => {
      // Update registration
      await tx.registration.update({
        where: { id: reg.id },
        data: {
          adultTickets: adults,
          kidsTickets: kids
        }
      });

      // Clear existing tickets if any
      if (reg.tickets.length > 0) {
        await tx.ticket.deleteMany({ where: { registrationId: reg.id } });
      }

      // Create new tickets
      const newTickets = [];
      for(let i=0; i<adults; i++) {
        newTickets.push({ registrationId: reg.id, ticketType: 'ADULT' as const });
      }
      for(let i=0; i<kids; i++) {
        newTickets.push({ registrationId: reg.id, ticketType: 'KIDS' as const });
      }

      if (newTickets.length > 0) {
        await tx.ticket.createMany({ data: newTickets });
      }
    });

    fixedCount++;
  }

  console.log(`Successfully fixed ${fixedCount} registrations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
