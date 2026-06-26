import { getMerchandiseOrders } from '@/actions/admin';
import MerchandiseAdminClient from './MerchandiseAdminClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMerchandisePage() {
  const res = await getMerchandiseOrders();
  const orders = res.success ? res.data : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Merchandise Orders</h1>
        <p className="text-slate-400 mt-2">Manage pre-orders and view manufacturing aggregates.</p>
      </div>

      <MerchandiseAdminClient initialOrders={orders} />
    </div>
  );
}
