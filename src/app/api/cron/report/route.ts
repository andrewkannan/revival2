import { NextResponse } from 'next/server';
import { sendDashboardReport } from '@/lib/report';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const isTest = url.searchParams.get('test') === '1';
    
    // We can add a secret key check here in the future if we use an external cron service
    
    const result = await sendDashboardReport();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Report sent successfully' });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// Allow GET for easy testing or external crons that only support GET
export async function GET(req: Request) {
  return POST(req);
}
