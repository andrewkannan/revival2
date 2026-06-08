import { getRegistrationById } from '@/actions/registration';
import UploadClient from './UploadClient';
import Link from 'next/link';

export default async function UploadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const res = await getRegistrationById(id);

  if (!res.success || !res.data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Registration Not Found</h1>
          <p className="text-slate-400 mb-8">The link you followed may be invalid or expired.</p>
          <Link href="/" className="bg-white text-black px-6 py-2 rounded-full font-medium">Return Home</Link>
        </div>
      </main>
    );
  }

  const reg = res.data;

  if (reg.receiptUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black py-24 px-6">
        <div className="max-w-xl mx-auto text-center bg-black/40 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Receipt Already Uploaded</h1>
          <p className="text-slate-400 mb-8">We already have a payment receipt on file for Order #R{String(reg.orderNumber).padStart(5, '0')}.</p>
          <Link href="/" className="bg-white text-black px-6 py-2 rounded-full font-medium">Return Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black py-12 md:py-24 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-2 drop-shadow-md">
            Complete Registration
          </h1>
          <p className="text-slate-400">
            Hi {reg.attendee.name}, please upload your payment receipt below to secure your tickets.
          </p>
        </div>
        
        <UploadClient 
          registrationId={reg.id} 
          totalAmount={Number(reg.totalAmount)} 
          orderNumber={reg.orderNumber} 
        />
      </div>
    </main>
  );
}
