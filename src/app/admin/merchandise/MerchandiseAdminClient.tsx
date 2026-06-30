'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Search, Package, User, Hash, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { updateMerchandiseOrderStatus } from '@/actions/admin';

type Props = {
  initialOrders: any[];
};

export default function MerchandiseAdminClient({ initialOrders }: Props) {
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Calculate Aggregates
  const aggregates = useMemo(() => {
    let totalRevenue = 0;
    const itemsCount: Record<string, Record<string, number>> = {};

    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        totalRevenue += Number(order.totalAmount);
        order.items.forEach((item: any) => {
          const type = item.itemType;
          const size = item.size || 'One Size';
          if (!itemsCount[type]) itemsCount[type] = {};
          if (!itemsCount[type][size]) itemsCount[type][size] = 0;
          itemsCount[type][size] += item.quantity;
        });
      }
    });

    return { totalRevenue, itemsCount };
  }, [orders]);

  // Filter Orders
  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.orderNumber.toLowerCase().includes(q) || 
      o.email.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    const res = await updateMerchandiseOrderStatus(orderId, status);
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } else {
      alert("Failed to update status");
    }
    setUpdating(null);
  };

  const handleExportCsv = () => {
    const headers = ['Order Number', 'Name', 'Email', 'Phone', 'Total Amount', 'Status', 'Date', 'Items'];
    const rows = orders.map(order => {
      const itemsString = order.items.map((i: any) => `${i.quantity}x ${i.itemType} ${i.size ? '('+i.size+')' : ''}`).join('; ');
      return [
        order.orderNumber,
        `"${order.name.replace(/"/g, '""')}"`,
        `"${order.email}"`,
        `"${order.phone}"`,
        Number(order.totalAmount).toFixed(2),
        order.status || 'PENDING',
        new Date(order.createdAt).toLocaleDateString(),
        `"${itemsString}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchandise-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      
      {/* Aggregates Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:col-span-1 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">Total Pre-Order Revenue</h3>
          </div>
          <p className="text-4xl font-bold text-emerald-400">RM {aggregates.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-2">To be collected on conference day</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-poster-accent" /> Manufacturing Aggregates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Object.keys(aggregates.itemsCount).map(type => (
              <div key={type} className="space-y-2">
                <h4 className="font-bold text-white border-b border-white/10 pb-1">{type}</h4>
                <ul className="space-y-1">
                  {Object.entries(aggregates.itemsCount[type]).map(([size, qty]) => (
                    <li key={size} className="flex justify-between text-sm">
                      <span className="text-slate-400">{size}</span>
                      <span className="font-medium text-white px-2 py-0.5 bg-white/10 rounded">{qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Order List ({filteredOrders.length})
          </h3>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-poster-accent"
              />
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-black/20 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Items Ordered</th>
                <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isCancelled = order.status === 'CANCELLED';
                  return (
                  <tr key={order.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-opacity ${isCancelled ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-mono text-poster-accent bg-poster-accent/10 px-2 py-1 rounded">
                        <Hash className="w-3 h-3" /> {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {order.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{order.email}</div>
                      <div className="text-xs text-slate-500">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="space-y-1">
                        {order.items.map((item: any, i: number) => (
                          <li key={i} className="text-xs">
                            <span className="font-medium text-white">{item.quantity}x</span> {item.itemType} {item.size ? `(${item.size})` : ''}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">
                      RM {Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {order.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                            <CheckCircle className="w-3 h-3" /> Paid & Collected
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded">
                            <XCircle className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                        {(!order.status || order.status === 'PENDING') && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        
                        <div className="flex gap-1 mt-1">
                          {order.status !== 'PAID' && (
                            <button 
                              disabled={updating === order.id}
                              onClick={() => handleUpdateStatus(order.id, 'PAID')}
                              className="text-xs px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded disabled:opacity-50"
                            >
                              Mark Paid
                            </button>
                          )}
                          {order.status !== 'CANCELLED' && (
                            <button 
                              disabled={updating === order.id}
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}<br/>
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
