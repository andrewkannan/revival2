import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = await prisma.registration.updateMany({
      where: {
        status: 'SEAT_SECURED',
        seatSecuredAt: null
      },
      data: {
        seatSecuredAt: yesterday
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${result.count} registrations to have a seatSecuredAt date of yesterday.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
