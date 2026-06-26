import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name || name.trim() === '') {
    return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
  }

  try {
    const attendee = await prisma.attendee.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive' // case-insensitive match
        }
      },
      select: {
        email: true,
        phone: true,
      }
    });

    if (attendee) {
      return NextResponse.json({ success: true, email: attendee.email, phone: attendee.phone });
    } else {
      return NextResponse.json({ success: false, message: 'No exact match found' });
    }
  } catch (error) {
    console.error('Error looking up attendee:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
