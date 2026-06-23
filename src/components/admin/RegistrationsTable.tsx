'use client';

import React, { useState, useMemo } from 'react';
import { RegistrationStatus, Registration, Attendee, OutreachLocation, Ticket } from '@prisma/client';
import { BadgeCheck, Clock, XCircle, AlertCircle, Search, X, Edit2, Download, FileArchive, QrCode, Trash2, Mail, Users } from 'lucide-react';
import JSZip from 'jszip';
import { deleteRegistration, sendBulkPaymentReminders, sendPaymentReminderTest, sendIndividualPaymentReminder, toggleRegistrationCheckin, resendTicketEmail } from '@/actions/admin';
import StatusSelect from '@/components/admin/StatusSelect';
import EditRegistrationModal, { EditData } from '@/components/admin/EditRegistrationModal';
import { motion, AnimatePresence } from 'framer-motion';

function CheckinControls({ 
  reg, 
  onToggle 
}: { 
  reg: RegistrationWithAttendee, 
  onToggle: (id: string, field: 'wristbandCollected' | 'starterPackCollected', val: boolean) => void 
}) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-black/40 border border-white/5 rounded-lg mt-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 flex items-center justify-between">
        Conference Check-In
        {reg.checkedInAt && <span className="text-emerald-500 font-normal">In: {new Date(reg.checkedInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onToggle(reg.id, 'wristbandCollected', !reg.wristbandCollected)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border ${reg.wristbandCollected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
        >
          {reg.wristbandCollected ? <BadgeCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          Wristband
        </button>
        <button 
          onClick={() => onToggle(reg.id, 'starterPackCollected', !reg.starterPackCollected)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border ${reg.starterPackCollected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
        >
          {reg.starterPackCollected ? <BadgeCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          Starter Pack
        </button>
      </div>
    </div>
  );
}

type RegistrationWithAttendee = Omit<Registration, 'totalAmount'> & { 
  totalAmount: string;
  orderNumber: number;
  wristbandCollected: boolean;
  starterPackCollected: boolean;
  checkedInAt: Date | null;
  attendee: Attendee; 
  tickets: Ticket[];
};

interface Props {
  initialData: RegistrationWithAttendee[];
}

export default function RegistrationsTable({ initialData }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
  const [outreachFilter, setOutreachFilter] = useState<OutreachLocation | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptModal, setReceiptModal] = useState<{ url: string; queueNum: string } | null>(null);
  const [ticketsModal, setTicketsModal] = useState<{ reg: RegistrationWithAttendee } | null>(null);
  const [editingData, setEditingData] = useState<EditData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isMailing, setIsMailing] = useState(false);
  const [mailMsg, setMailMsg] = useState('');

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this registration?')) {
      setIsDeleting(id);
      await deleteRegistration(id);
      setIsDeleting(null);
    }
  };

  const handleTestEmail = async () => {
    setIsMailing(true);
    setMailMsg('Sending test...');
    const res = await sendPaymentReminderTest();
    setMailMsg(res.message);
    setTimeout(() => {
      setIsMailing(false);
      setMailMsg('');
    }, 3000);
  };

  const handleToggleCheckin = async (id: string, field: 'wristbandCollected' | 'starterPackCollected', val: boolean) => {
    await toggleRegistrationCheckin(id, field, val);
  };

  const handleBulkEmail = async () => {
    if (window.confirm('Are you sure you want to send reminder emails to ALL pending users who have not uploaded a receipt?')) {
      setIsMailing(true);
      setMailMsg('Sending bulk emails...');
      const res = await sendBulkPaymentReminders();
      setMailMsg(res.message);
      setTimeout(() => setMailMsg(''), 4000);
      setIsMailing(false);
    }
  };

  const [mailingId, setMailingId] = useState<string | null>(null);

  const handleIndividualEmail = async (id: string, name: string) => {
    if (window.confirm(`Send payment reminder to ${name}?`)) {
      setMailingId(id);
      const res = await sendIndividualPaymentReminder(id);
      alert(res.message);
      setMailingId(null);
    }
  };

  const [resendId, setResendId] = useState<string | null>(null);
  const handleResendTicket = async (id: string, name: string) => {
    if (window.confirm(`Resend Master Ticket email to ${name}?`)) {
      setResendId(id);
      const res = await resendTicketEmail(id);
      alert(res.message);
      setResendId(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Queue No', 'Name', 'Email', 'Phone', 'Location', 'Adult Tickets', 'Total Amount', 'Status', 'Date'];
    const rows = filteredAndSorted.map(reg => [
      formatQueue(reg.orderNumber),
      `"${reg.attendee.name.replace(/"/g, '""')}"`,
      reg.attendee.email,
      reg.attendee.phone,
      reg.attendee.outreach,
      reg.adultTickets,
      reg.totalAmount,
      reg.status,
      new Date(reg.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprintTextOnImage = (base64Str: string, text: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str.split(',')[1] || base64Str);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Draw background for text at the top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const barHeight = Math.max(50, img.height * 0.05);
        ctx.fillRect(0, 0, img.width, barHeight);
        
        // Draw text
        ctx.fillStyle = 'white';
        const fontSize = Math.max(20, barHeight * 0.5);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, Math.max(20, img.width * 0.02), barHeight / 2);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl.split(',')[1]);
      };
      
      img.onerror = () => {
        resolve(base64Str.split(',')[1] || base64Str);
      };
    });
  };

  const exportReceiptsZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      let hasFiles = false;
      
      for (const reg of filteredAndSorted) {
        if (reg.status === 'SEAT_SECURED') {
          if (reg.receiptUrl) {
            hasFiles = true;
            const filename = `${formatQueue(reg.orderNumber)}_${reg.attendee.name.replace(/[^a-zA-Z0-9]/g, '_')}_Receipt.jpg`;
            const imprintedBase64 = await imprintTextOnImage(reg.receiptUrl, filename);
            zip.file(filename, imprintedBase64, { base64: true });
          }
          if ((reg as any).receiptUrl2) {
            hasFiles = true;
            const filename2 = `${formatQueue(reg.orderNumber)}_${reg.attendee.name.replace(/[^a-zA-Z0-9]/g, '_')}_Receipt_2.jpg`;
            const imprintedBase642 = await imprintTextOnImage((reg as any).receiptUrl2, filename2);
            zip.file(filename2, imprintedBase642, { base64: true });
          }
        }
      }

      if (!hasFiles) {
        alert("No receipts found for SEAT_SECURED registrations in the current list.");
        setIsExporting(false);
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Receipts_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error generating zip:", e);
      alert("Failed to generate zip file.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatQueue = (num: number) => 'R' + String(num).padStart(5, '0');

  const formatPhoneForWhatsapp = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    // If it starts with 0 (e.g., 0123456789), replace with 60 (Malaysia code)
    if (cleaned.startsWith('0')) {
      cleaned = '6' + cleaned;
    }
    return cleaned;
  };

  const getStatusIcon = (status: RegistrationStatus) => {
    switch (status) {
      case 'SEAT_SECURED': return <BadgeCheck className="w-4 h-4 text-emerald-400" />;
      case 'PENDING_FOR_PAYMENT': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'PENDING_FOR_REVIEW': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'PAYMENT_REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CONTACT_ADMIN': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'TICKET_CANCELLED': return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = initialData.filter(reg => {
      // Status filter
      if (statusFilter !== 'ALL' && reg.status !== statusFilter) return false;
      
      // Outreach filter
      if (outreachFilter !== 'ALL' && reg.attendee.outreach !== outreachFilter) return false;
      
      // Search filter
      if (search) {
        const query = search.toLowerCase();
        if (
          !reg.attendee.name.toLowerCase().includes(query) &&
          !reg.attendee.email.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Date Filter (based purely on seatSecuredAt)
      if (dateFrom || dateTo) {
        if (!((reg as any).seatSecuredAt)) {
          return false; // If filtering by date, exclude registrations that don't have a seat secured date
        }
        
        const regDate = new Date((reg as any).seatSecuredAt);
        regDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (regDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (regDate > to) return false;
        }
      }

      return true;
    });

    // Sort: PENDING_FOR_REVIEW first, then by createdAt desc
    result.sort((a, b) => {
      if (a.status === 'PENDING_FOR_REVIEW' && b.status !== 'PENDING_FOR_REVIEW') return -1;
      if (a.status !== 'PENDING_FOR_REVIEW' && b.status === 'PENDING_FOR_REVIEW') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [initialData, search, statusFilter, outreachFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | 'ALL')}
          className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-poster-accent transition-colors appearance-none"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING_FOR_PAYMENT">Pending Payment</option>
          <option value="PENDING_FOR_REVIEW">Pending Review</option>
          <option value="PAYMENT_REJECTED">Payment Rejected</option>
          <option value="SEAT_SECURED">Seat Secured</option>
          <option value="CONTACT_ADMIN">Contact Admin</option>
          <option value="TICKET_CANCELLED">Ticket Cancelled</option>
        </select>

        <select
          value={outreachFilter}
          onChange={(e) => setOutreachFilter(e.target.value as any)}
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="ALL">All Locations</option>
          <option value="JOHOR_BAHRU">Johor Bahru</option>
          <option value="ISKANDAR_PUTERI">Iskandar Puteri</option>
          <option value="TAMAN_DAYA">Taman Daya</option>
          <option value="PELANGI_INDAH">Pelangi Indah</option>
          <option value="MELAKA">Melaka</option>
          <option value="SIMPANG_RENGGAM">Simpang Renggam</option>
          <option value="OTHERS">Others</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
        <span className="text-sm text-slate-400 font-medium whitespace-nowrap">Filter by Date:</span>
        <input 
          type="date" 
          value={dateFrom} 
          onChange={(e) => setDateFrom(e.target.value)} 
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          title="From Date"
        />
        <span className="text-sm text-slate-400">to</span>
        <input 
          type="date" 
          value={dateTo} 
          onChange={(e) => setDateTo(e.target.value)} 
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          title="To Date"
        />
        {(dateFrom || dateTo) && (
          <button 
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-red-400 hover:text-red-300 ml-2"
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Export Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleTestEmail}
            disabled={isMailing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" /> Test Reminder
          </button>
          <button 
            onClick={handleBulkEmail}
            disabled={isMailing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" /> Bulk Remind
          </button>
          {mailMsg && <span className="text-sm text-slate-300 flex items-center">{mailMsg}</span>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={exportCSV} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV (Excel)
          </button>
          <button 
            onClick={exportReceiptsZip} 
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-poster-accent/20 hover:bg-poster-accent/30 text-poster-accent border border-poster-accent/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FileArchive className="w-4 h-4" /> {isExporting ? 'Zipping...' : 'Download Receipts (ZIP)'}
          </button>
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-4 font-medium">Queue No.</th>
                <th className="px-4 py-4 font-medium">Attendee</th>
                <th className="px-4 py-4 font-medium">Order Details</th>
                <th className="px-4 py-4 font-medium text-center">Receipt</th>
                <th className="px-4 py-4 font-medium text-right">Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>No registrations match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((reg) => (
                  <tr 
                    key={reg.id} 
                    className={`border-b border-white/5 transition-all duration-300 ${
                      reg.status === 'SEAT_SECURED' ? 'bg-black/80 opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:bg-white/[0.04]'
                    } ${reg.status === 'PENDING_FOR_REVIEW' ? 'bg-poster-accent/10 border-l-4 border-l-poster-accent' : 
                        (reg.status === 'PAYMENT_REJECTED' || reg.status === 'TICKET_CANCELLED') ? 'bg-red-500/10 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <td className="px-4 py-4 font-mono font-bold text-poster-accent whitespace-nowrap">
                      {formatQueue(reg.orderNumber)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{reg.attendee.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{reg.attendee.email}</div>
                      <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                        {reg.attendee.phone}
                        <a 
                          href={`https://wa.me/${formatPhoneForWhatsapp(reg.attendee.phone)}?text=Hi ${encodeURIComponent(reg.attendee.name)}, regarding your REVIVAL registration...`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Message on WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                        </a>
                      </div>

                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-white mb-0.5">RM {reg.totalAmount}</div>
                      <div className="text-slate-400 text-xs">
                        {reg.adultTickets} Adult {reg.kidsTickets > 0 && `, ${reg.kidsTickets} Kids`}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {reg.attendee.outreach.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {reg.receiptUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <button 
                            onClick={() => setReceiptModal({ url: reg.receiptUrl!, queueNum: formatQueue(reg.orderNumber) })}
                            className="text-poster-accent hover:text-poster-accent-bright underline text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                          >
                            View Proof 1
                          </button>
                          {(reg as any).receiptUrl2 && (
                            <button 
                              onClick={() => setReceiptModal({ url: (reg as any).receiptUrl2!, queueNum: formatQueue(reg.orderNumber) + " (2)" })}
                              className="text-poster-accent hover:text-poster-accent-bright underline text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                            >
                              View Proof 2
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs whitespace-nowrap">No Receipt</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-end gap-2">
                        {reg.status === 'SEAT_SECURED' && (
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <button
                              onClick={() => setTicketsModal({ reg })}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors border border-emerald-500/20 whitespace-nowrap"
                            >
                              <QrCode className="w-3.5 h-3.5" /> View Ticket
                            </button>
                            <button
                              onClick={() => handleResendTicket(reg.id, reg.attendee.name)}
                              disabled={resendId === reg.id}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors border border-blue-500/20 whitespace-nowrap disabled:opacity-50"
                              title="Resend Ticket Email"
                            >
                              <Mail className="w-3.5 h-3.5" /> {resendId === reg.id ? '...' : 'Resend'}
                            </button>
                          </div>
                        )}
                        <StatusSelect registrationId={reg.id} currentStatus={reg.status} />
                        {reg.status === 'SEAT_SECURED' && (reg as any).seatSecuredAt && (
                          <div className="text-[10px] text-emerald-400/70 -mt-1 mb-1">
                            Secured: {new Date((reg as any).seatSecuredAt).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setEditingData({
                              id: reg.id,
                              attendeeId: reg.attendee.id,
                              name: reg.attendee.name,
                              email: reg.attendee.email,
                              phone: reg.attendee.phone,
                              outreach: reg.attendee.outreach,
                              totalAmount: reg.totalAmount,
                              status: reg.status,
                              receiptUrl: reg.receiptUrl,
                              receiptUrl2: (reg as any).receiptUrl2 || null,
                              orderNumber: reg.orderNumber,
                              adultTickets: reg.adultTickets,
                              kidsTickets: reg.kidsTickets
                            })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors border border-white/10"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(reg.id)}
                            disabled={isDeleting === reg.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/80 rounded transition-colors border border-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {isDeleting === reg.id ? '...' : 'Del'}
                          </button>
                          {reg.status === 'PENDING_FOR_PAYMENT' && !reg.receiptUrl && (
                            <button
                              onClick={() => handleIndividualEmail(reg.id, reg.attendee.name)}
                              disabled={mailingId === reg.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/80 rounded transition-colors border border-blue-500/20 disabled:opacity-50"
                              title="Send Reminder"
                            >
                              <Mail className="w-3.5 h-3.5" /> {mailingId === reg.id ? '...' : 'Remind'}
                            </button>
                          )}

                        </div>
                        {reg.status === 'SEAT_SECURED' && (
                          <CheckinControls reg={reg} onToggle={handleToggleCheckin} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden flex flex-col divide-y divide-white/5">
          {filteredAndSorted.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-8 h-8 mb-2 opacity-50 mx-auto" />
              <p>No registrations match your filters.</p>
            </div>
          ) : (
            filteredAndSorted.map((reg) => (
              <div 
                key={reg.id} 
                className={`p-4 space-y-4 ${
                  reg.status === 'SEAT_SECURED' ? 'bg-black/40 grayscale opacity-75' : ''
                } ${reg.status === 'PENDING_FOR_REVIEW' ? 'bg-poster-accent/5' : 
                    (reg.status === 'PAYMENT_REJECTED' || reg.status === 'TICKET_CANCELLED') ? 'bg-red-500/5' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-poster-accent text-lg mb-1">{formatQueue(reg.orderNumber)}</div>
                    <div className="font-medium text-white text-base">{reg.attendee.name}</div>
                    <div className="text-slate-400 text-sm mt-0.5">{reg.attendee.email}</div>
                    <div className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                      {reg.attendee.phone}
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsapp(reg.attendee.phone)}?text=Hi ${encodeURIComponent(reg.attendee.name)}, regarding your REVIVAL registration...`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Message on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      </a>
                    </div>

                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {reg.receiptUrl ? (
                      <div className="flex flex-col items-end gap-1">
                        <button 
                          onClick={() => setReceiptModal({ url: reg.receiptUrl!, queueNum: formatQueue(reg.orderNumber) })}
                          className="px-3 py-1.5 bg-poster-accent/20 text-poster-accent text-xs font-medium rounded hover:bg-poster-accent/30 transition-colors"
                        >
                          View Proof 1
                        </button>
                        {(reg as any).receiptUrl2 && (
                          <button 
                            onClick={() => setReceiptModal({ url: (reg as any).receiptUrl2!, queueNum: formatQueue(reg.orderNumber) + " (2)" })}
                            className="px-3 py-1.5 bg-poster-accent/20 text-poster-accent text-xs font-medium rounded hover:bg-poster-accent/30 transition-colors"
                          >
                            View Proof 2
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs px-3 py-1.5">No Receipt</span>
                    )}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingData({
                          id: reg.id,
                          attendeeId: reg.attendee.id,
                          name: reg.attendee.name,
                          email: reg.attendee.email,
                          phone: reg.attendee.phone,
                          outreach: reg.attendee.outreach,
                          totalAmount: reg.totalAmount,
                          status: reg.status,
                          receiptUrl: reg.receiptUrl,
                          receiptUrl2: (reg as any).receiptUrl2 || null,
                          orderNumber: reg.orderNumber,
                          adultTickets: reg.adultTickets,
                          kidsTickets: reg.kidsTickets
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors border border-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(reg.id)}
                        disabled={isDeleting === reg.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/80 rounded transition-colors border border-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {isDeleting === reg.id ? '...' : 'Del'}
                      </button>
                      {reg.status === 'PENDING_FOR_PAYMENT' && !reg.receiptUrl && (
                        <button
                          onClick={() => handleIndividualEmail(reg.id, reg.attendee.name)}
                          disabled={mailingId === reg.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/80 rounded transition-colors border border-blue-500/20 disabled:opacity-50"
                          title="Send Reminder"
                        >
                          <Mail className="w-3.5 h-3.5" /> {mailingId === reg.id ? '...' : 'Remind'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end bg-black/30 p-3 rounded-lg border border-white/5">
                  <div>
                    <div className="font-medium text-white mb-0.5">RM {reg.totalAmount}</div>
                    <div className="text-slate-400 text-xs">
                      {reg.adultTickets} Adult {reg.kidsTickets > 0 && `, ${reg.kidsTickets} Kids`}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {reg.attendee.outreach.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {reg.status === 'SEAT_SECURED' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setTicketsModal({ reg })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors border border-emerald-500/20"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View Ticket
                        </button>
                        <button
                          onClick={() => handleResendTicket(reg.id, reg.attendee.name)}
                          disabled={resendId === reg.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors border border-blue-500/20 disabled:opacity-50"
                          title="Resend Ticket Email"
                        >
                          <Mail className="w-3.5 h-3.5" /> {resendId === reg.id ? '...' : 'Resend Ticket'}
                        </button>
                      </div>
                    )}
                    <StatusSelect registrationId={reg.id} currentStatus={reg.status} />
                    {reg.status === 'SEAT_SECURED' && (reg as any).seatSecuredAt && (
                      <div className="text-[10px] text-emerald-400/70 -mt-1 mb-1">
                        Secured: {new Date((reg as any).seatSecuredAt).toLocaleDateString('en-GB')}
                      </div>
                    )}

                  </div>
                </div>

                {reg.status === 'SEAT_SECURED' && (
                  <CheckinControls reg={reg} onToggle={handleToggleCheckin} />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {receiptModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setReceiptModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#1c272a] border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white">Payment Receipt - {receiptModal.queueNum}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={receiptModal.url}
                    download={`${receiptModal.queueNum}_Receipt.jpg`}
                    className="px-4 py-2 bg-poster-accent text-poster-bg text-sm font-medium rounded-lg hover:bg-poster-accent-bright transition-colors"
                  >
                    Download Receipt
                  </a>
                  <button onClick={() => setReceiptModal(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white ml-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto p-4 flex justify-center items-center bg-black/50 min-h-[50vh]">
                <img src={receiptModal.url} alt="Payment Receipt" className="max-w-full h-auto rounded-xl shadow-2xl" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {ticketsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setTicketsModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-w-2xl w-full max-h-[90vh] flex flex-col bg-[#1c272a] border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white">E-Ticket - {formatQueue(ticketsModal.reg.orderNumber)}</h3>
                <button onClick={() => setTicketsModal(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto p-6 bg-black/50 flex flex-col items-center gap-6">
                {(ticketsModal.reg.tickets && ticketsModal.reg.tickets.length > 0 
                  ? ticketsModal.reg.tickets 
                  : Array.from({ length: ticketsModal.reg.adultTickets + ticketsModal.reg.kidsTickets }).map((_, i) => ({
                      id: `legacy-${i}`,
                      ticketType: i < ticketsModal.reg.adultTickets ? 'ADULT' : 'KIDS',
                      attendeeName: i === 0 ? ticketsModal.reg.attendee.name : 'Pending'
                    }))
                ).map((ticket: any, index: number) => (
                  <div key={ticket.id} className="bg-white max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl relative border-2 border-white/10 shrink-0">
                    <div className="bg-[#0f172a] p-6 text-center text-white relative">
                      <h2 className="m-0 text-2xl tracking-widest font-bold">REVIVAL 2026</h2>
                      <p className="m-0 mt-1 text-slate-400 text-sm flex items-center justify-center gap-2">
                        Official Conference Pass 
                        {ticket.ticketType === 'KIDS' && <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold tracking-normal">KIDS</span>}
                      </p>
                    </div>
                    <div className="p-8 bg-white flex justify-center">
                      {ticket.qrCodeUrl ? (
                        <img src={ticket.qrCodeUrl} alt="Ticket QR Code" className="w-48 h-48 object-contain" />
                      ) : (ticketsModal.reg as any).qrCodeUrl ? (
                        <img src={(ticketsModal.reg as any).qrCodeUrl} alt="Master QR Code" className="w-48 h-48 object-contain" />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-sm text-center p-4">
                          QR code missing or not yet generated
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 border-t-2 border-dashed border-slate-300 p-6 text-center flex flex-col gap-1">
                      <p className="m-0 font-bold text-2xl text-slate-900 truncate px-2" title={ticket.attendeeName || (index === 0 ? ticketsModal.reg.attendee.name : 'Pending')}>
                        {ticket.attendeeName || (index === 0 ? ticketsModal.reg.attendee.name : 'Pending')}
                      </p>
                      <p className="m-0 text-slate-500 font-mono tracking-widest">{formatQueue(ticketsModal.reg.orderNumber)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingData && (
          <EditRegistrationModal 
            data={editingData} 
            onClose={() => setEditingData(null)} 
          />
        )}


      </AnimatePresence>
    </div>
  );
}
