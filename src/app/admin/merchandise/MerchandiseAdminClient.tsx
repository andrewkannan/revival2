'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Search, Package, User, Hash, CheckCircle, XCircle, Clock, Download, Eye, X, Mail, Banknote, MessageCircle } from 'lucide-react';
import JSZip from 'jszip';
import { updateMerchandiseOrderStatus } from '@/actions/admin';
import { sendMerchReminderEmail } from '@/actions/merchandise';

type Props = {
  initialOrders: any[];
};

export default function MerchandiseAdminClient({ initialOrders }: Props) {
  const [search, setSearch] = useState('');
  const [filterHasReceipt, setFilterHasReceipt] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [isDownloadingReceipts, setIsDownloadingReceipts] = useState(false);
  const [previewModal, setPreviewModal] = useState<{url: string, title: string} | null>(null);
  
  // Calculate Aggregates
  const aggregates = useMemo(() => {
    let totalRevenue = 0;
    let cashCollected = 0;
    let transferCollected = 0;
    const itemsCount: Record<string, Record<string, number>> = {};

    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        totalRevenue += Number(order.totalAmount);
        
        if (order.status === 'CASH_PAID') {
          cashCollected += Number(order.totalAmount);
        } else if (order.status === 'PAID') {
          transferCollected += Number(order.totalAmount);
        }

        order.items.forEach((item: any) => {
          const type = item.itemType;
          const size = item.size || 'One Size';
          if (!itemsCount[type]) itemsCount[type] = {};
          if (!itemsCount[type][size]) itemsCount[type][size] = 0;
          itemsCount[type][size] += item.quantity;
        });
      }
    });

    return { totalRevenue, cashCollected, transferCollected, itemsCount };
  }, [orders]);

  // Filter Orders
  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (filterHasReceipt) {
      result = result.filter(o => !!o.receiptUrl);
    }
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o => 
        o.name.toLowerCase().includes(q) || 
        o.orderNumber.toLowerCase().includes(q) || 
        o.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, filterHasReceipt]);

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

  const handleSendReminder = async (orderId: string, isTest: boolean = false) => {
    setSendingReminder(orderId);
    const email = isTest ? 'kannanandrew101@gmail.com' : undefined;
    const res = await sendMerchReminderEmail(orderId, email);
    if (res.success) {
      alert(isTest ? "Test reminder sent!" : "Reminder sent!");
    } else {
      alert("Failed to send reminder.");
    }
    setSendingReminder(null);
  };

  const handleTestReminder = () => {
    const pendingOrders = orders.filter(o => o.status !== 'PAID' && o.status !== 'CASH_PAID' && o.status !== 'CANCELLED');
    if (pendingOrders.length === 0) {
      alert("No pending orders available to send a test reminder.");
      return;
    }
    // Pick the first pending order as a sample
    handleSendReminder(pendingOrders[0].id, true);
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

  const handleDownloadReceipts = async () => {
    setIsDownloadingReceipts(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("merch_receipts");
      
      if (!folder) throw new Error("Failed to create zip folder");

      const ordersWithReceipts = filteredOrders.filter(o => o.receiptUrl);
      
      if (ordersWithReceipts.length === 0) {
        alert("No receipts found for the current filter.");
        setIsDownloadingReceipts(false);
        return;
      }

      for (const order of ordersWithReceipts) {
        let data = order.receiptUrl;
        let extension = 'jpg';
        if (data.startsWith('data:')) {
          const mimeType = data.split(';')[0].split(':')[1] || '';
          if (mimeType.includes('png')) extension = 'png';
          else if (mimeType.includes('pdf')) extension = 'pdf';
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
        }

        const filename = `Merch_${order.orderNumber}_${order.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
        
        try {
          const response = await fetch(data);
          const blob = await response.blob();
          folder.file(filename, blob);
        } catch (e) {
          console.error(`Failed to process ${filename}`, e);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Merch_Receipts_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error("Failed to generate ZIP", error);
      alert("Failed to generate ZIP file.");
    } finally {
      setIsDownloadingReceipts(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Aggregates Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:col-span-1 flex flex-col justify-center space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-300">Total Pre-Order Value</h3>
            </div>
            <p className="text-2xl font-bold text-white">RM {aggregates.totalRevenue.toFixed(2)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <h3 className="text-xs font-medium text-slate-400 mb-1">Transfer Paid</h3>
              <p className="text-lg font-bold text-emerald-400">RM {aggregates.transferCollected.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-slate-400 mb-1">Cash Paid</h3>
              <p className="text-lg font-bold text-emerald-400">RM {aggregates.cashCollected.toFixed(2)}</p>
            </div>
          </div>
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
            <button
              onClick={handleTestReminder}
              disabled={sendingReminder !== null}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm font-medium rounded-lg transition-colors border border-indigo-500/30 whitespace-nowrap"
            >
              <Mail className="w-4 h-4" /> Test Reminder
            </button>
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
              onClick={() => setFilterHasReceipt(!filterHasReceipt)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border whitespace-nowrap ${filterHasReceipt ? 'bg-poster-accent text-black border-poster-accent' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}
            >
              Has Receipt {filterHasReceipt && '✓'}
            </button>
            <button
              onClick={handleDownloadReceipts}
              disabled={isDownloadingReceipts}
              className="flex items-center gap-2 px-4 py-2 bg-poster-accent/20 hover:bg-poster-accent/30 text-poster-accent text-sm font-medium rounded-lg transition-colors border border-poster-accent/30 whitespace-nowrap"
            >
              {isDownloadingReceipts ? (
                <span className="animate-spin text-xl leading-none">⟳</span>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Receipts
            </button>
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
                            <CheckCircle className="w-3 h-3" /> Paid (Transfer)
                          </span>
                        )}
                        {order.status === 'CASH_PAID' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                            <CheckCircle className="w-3 h-3" /> Paid (Cash)
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
                        
                        <div className="flex gap-1 mt-1 justify-center flex-wrap max-w-[200px]">
                          {order.receiptUrl && (
                            <button
                              onClick={() => setPreviewModal({ url: order.receiptUrl, title: `${order.orderNumber} - ${order.name}` })}
                              className="text-xs px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold rounded flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                          )}
                          {(order.status === 'PENDING' || !order.status) && (
                            <>
                              <button 
                                disabled={sendingReminder === order.id}
                                onClick={() => handleSendReminder(order.id)}
                                className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded flex items-center gap-1 disabled:opacity-50"
                              >
                                <Mail className="w-3 h-3" /> {sendingReminder === order.id ? '...' : 'Remind'}
                              </button>
                              <a 
                                href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '').replace(/^0/, '60')}?text=${encodeURIComponent(`Hi ${order.name},\n\nThis is a friendly reminder that we are waiting for your payment for your official REVIVAL merchandise pre-order.\n\nOutstanding Amount: *RM ${Number(order.totalAmount).toFixed(2)}*\n\nPlease upload your payment receipt here: https://revival.thisiscccbilingual.com/merch-upload/${order.id}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" /> WA
                              </a>
                            </>
                          )}
                          {order.status !== 'CANCELLED' && order.status !== 'PAID' && (
                            <button 
                              disabled={updating === order.id}
                              onClick={() => handleUpdateStatus(order.id, 'PAID')}
                              className="text-xs px-2 py-1 bg-emerald-500/80 hover:bg-emerald-500 text-black font-bold rounded disabled:opacity-50"
                            >
                              Mark Transfer
                            </button>
                          )}
                          {order.status !== 'CANCELLED' && order.status !== 'CASH_PAID' && (
                            <button 
                              disabled={updating === order.id}
                              onClick={() => handleUpdateStatus(order.id, 'CASH_PAID')}
                              className="text-xs px-2 py-1 bg-emerald-500/80 hover:bg-emerald-500 text-black font-bold rounded flex items-center gap-1 disabled:opacity-50"
                            >
                              <Banknote className="w-3 h-3" /> Cash
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

      {previewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewModal(null)}>
          <div className="relative max-w-4xl w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Receipt Preview <span className="text-slate-400 text-sm font-normal ml-2">{previewModal.title}</span></h3>
              <button onClick={() => setPreviewModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex items-center justify-center bg-black/50 min-h-[300px]">
              {previewModal.url.includes('pdf') ? (
                <iframe src={previewModal.url} className="w-full h-[600px] rounded-lg" />
              ) : (
                <img src={previewModal.url} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
