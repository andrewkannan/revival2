import prisma from '@/lib/prisma';
import ReceiptsClient from '@/components/admin/ReceiptsClient';
import { unstable_noStore as noStore } from 'next/cache';

export default async function AdminReceiptsPage() {
  noStore();
  
  const registrations = await prisma.registration.findMany({
    where: {
      OR: [
        { receiptUrl: { not: null } },
        { receiptUrl2: { not: null } }
      ]
    },
    include: { attendee: true },
    orderBy: { updatedAt: 'desc' }
  });

  // Map to a cleaner structure for the client
  const receipts = [];
  
  for (const reg of registrations) {
    if (reg.receiptUrl) {
      receipts.push({
        id: `${reg.id}-1`,
        registrationId: reg.id,
        orderNumber: reg.orderNumber,
        attendeeName: reg.attendee.name,
        attendeeEmail: reg.attendee.email,
        url: reg.receiptUrl,
        uploadedAt: reg.receiptUploadedAt ? reg.receiptUploadedAt.toISOString() : null,
        type: 'Primary'
      });
    }
    if ((reg as any).receiptUrl2) {
      receipts.push({
        id: `${reg.id}-2`,
        registrationId: reg.id,
        orderNumber: reg.orderNumber,
        attendeeName: reg.attendee.name,
        attendeeEmail: reg.attendee.email,
        url: (reg as any).receiptUrl2,
        uploadedAt: (reg as any).receipt2UploadedAt ? (reg as any).receipt2UploadedAt.toISOString() : null,
        type: 'Secondary'
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Receipts</h1>
          <p className="text-slate-400 mt-1">Filter and download all uploaded payment receipts.</p>
        </div>
      </div>
      
      <ReceiptsClient initialReceipts={receipts} />
    </div>
  );
}
