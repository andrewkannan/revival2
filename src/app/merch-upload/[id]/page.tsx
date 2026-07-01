import { getMerchOrderById } from '@/actions/merchandise';
import UploadMerchClient from './UploadMerchClient';
import Link from 'next/link';

export default async function MerchUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getMerchOrderById(id);

  if (!res.success || !res.data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Order Not Found</h1>
          <p className="text-slate-400 mb-8">The link you followed may be invalid or expired.</p>
          <Link href="/" className="bg-white text-black px-6 py-2 rounded-full font-medium">Return Home</Link>
        </div>
      </main>
    );
  }

  const order = res.data;

  if (order.receiptUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#263336] to-black py-24 px-6">
        <div className="max-w-xl mx-auto text-center bg-black/40 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Receipt Already Uploaded</h1>
          <p className="text-slate-400 mb-8">We already have a payment receipt on file for Order #{order.orderNumber}.</p>
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
            Complete Merch Pre-Order
          </h1>
          <p className="text-slate-400">
            Hi {order.name}, please upload your payment receipt below to secure your merchandise order.
          </p>
        </div>
        
        <UploadMerchClient 
          orderId={order.id} 
          totalAmount={Number(order.totalAmount)} 
          orderNumber={order.orderNumber} 
        />
      </div>
    </main>
  );
}
