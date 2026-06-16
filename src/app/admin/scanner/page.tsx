'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getRegistrationByTicketId, toggleRegistrationCheckin } from '@/actions/admin';
import { Registration, Attendee, Ticket } from '@prisma/client';
import { BadgeCheck, Clock, CheckCircle2, User, Loader2 } from 'lucide-react';

const formatQueue = (num: number) => 'R' + String(num).padStart(5, '0');

type RegData = Registration & {
  attendee: Attendee;
  tickets: Ticket[];
};

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reg, setReg] = useState<RegData | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Debounce / prevent rapid scanning of same code
        if (decodedText !== scanResult) {
          setScanResult(decodedText);
          handleScan(decodedText);
        }
      },
      (error) => {
        // Ignore constant error streams from scanning frame
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanResult]);

  const handleScan = async (ticketId: string) => {
    setLoading(true);
    setError('');
    setReg(null);

    const res = await getRegistrationByTicketId(ticketId);
    if (res.success && res.registration) {
      setReg(res.registration as RegData);
    } else {
      setError(res.message || 'Invalid QR code.');
      setTimeout(() => setScanResult(null), 3000); // Allow rescan after 3s
    }
    
    setLoading(false);
  };

  const handleToggle = async (field: 'wristbandCollected' | 'starterPackCollected', val: boolean) => {
    if (!reg) return;
    
    // Optimistic UI update
    setReg({ ...reg, [field]: val });
    
    const res = await toggleRegistrationCheckin(reg.id, field, val);
    if (!res.success) {
      // Revert if failed
      setReg({ ...reg, [field]: !val });
      alert("Failed to update status");
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setReg(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Code Check-In</h1>
        <p className="text-slate-400 mt-2">Scan an attendee's E-Ticket to bring up their registration details and track collections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Scanner Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl p-4">
          <div id="reader" className="w-full bg-black rounded-xl overflow-hidden [&_video]:w-full [&_video]:rounded-xl [&_#reader__dashboard_section_csr]:hidden [&_button]:bg-white [&_button]:text-black [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:font-medium [&_button]:mt-4 [&_select]:bg-black [&_select]:text-white [&_select]:border [&_select]:border-white/20 [&_select]:rounded-md [&_select]:px-3 [&_select]:py-2"></div>
        </div>

        {/* Result Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Fetching registration details...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-400 bg-red-500/5 p-8 text-center">
              <XCircle className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-lg font-bold mb-2">Scan Failed</h3>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : reg ? (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
              <div className="bg-poster-accent/20 border-b border-poster-accent/30 p-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{reg.attendee.name}</h2>
                  <div className="text-poster-accent font-mono font-bold tracking-widest text-lg">
                    {formatQueue(reg.orderNumber)}
                  </div>
                </div>
                <div className="bg-black/50 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 border border-white/10 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {reg.tickets.length} Ticket{reg.tickets.length !== 1 && 's'}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Email</p>
                    <p className="text-sm text-slate-300 truncate">{reg.attendee.email}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Phone</p>
                    <p className="text-sm text-slate-300 truncate">{reg.attendee.phone}</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-4">Collection Tracking</h3>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handleToggle('wristbandCollected', !reg.wristbandCollected)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        reg.wristbandCollected 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 font-medium">
                        {reg.wristbandCollected ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 opacity-50" />}
                        Wristbands Collected
                      </div>
                      <div className="text-xs opacity-70">Tap to toggle</div>
                    </button>

                    <button 
                      onClick={() => handleToggle('starterPackCollected', !reg.starterPackCollected)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        reg.starterPackCollected 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 font-medium">
                        {reg.starterPackCollected ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 opacity-50" />}
                        Starter Packs Collected
                      </div>
                      <div className="text-xs opacity-70">Tap to toggle</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-black/20">
                <button 
                  onClick={resetScanner}
                  className="w-full bg-white text-black font-medium px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Scan Next Attendee
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <QrCodeIcon className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">Ready to Scan</h3>
              <p className="text-sm">Position a ticket QR code within the frame to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QrCodeIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <rect x="7" y="7" width="3" height="3"></rect>
      <rect x="14" y="7" width="3" height="3"></rect>
      <rect x="7" y="14" width="3" height="3"></rect>
      <rect x="14" y="14" width="3" height="3"></rect>
    </svg>
  );
}
