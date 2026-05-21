import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Simple auth check to ensure only admin can run this
  const adminCookie = (await cookies()).get('revival_admin_session');
  if (!adminCookie || adminCookie.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    let fixedCount = 0;
    const log = [];

    for (const reg of registrations) {
      const amount = Number(reg.totalAmount);
      let adults = 0;
      let kids = 0;

      // Guessing logic based on standard RM 50 for adult and RM 25 for kids
      if (amount % 50 === 0) {
        adults = amount / 50;
      } else if (amount % 25 === 0) {
        const remaining = amount % 50; 
        adults = Math.floor(amount / 50);
        kids = remaining / 25;
      } else {
        log.push(`Could not guess tickets for order ${reg.orderNumber} with amount ${amount}`);
        continue;
      }

      log.push(`Order ${reg.orderNumber} (RM ${amount}) -> ${adults} Adult, ${kids} Kids`);

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

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} registrations.`,
      log
    });
  } catch (error: any) {
    console.error('Error fixing tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
