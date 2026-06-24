'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getRegistrationByTicketId, toggleRegistrationCheckin, searchRegistrationManual, logoutScanner } from '@/actions/admin';
import { Registration, Attendee, Ticket } from '@prisma/client';
import { BadgeCheck, Clock, CheckCircle2, User, Loader2, XCircle, ArrowLeft, Search, LogOut } from 'lucide-react';
import Link from 'next/link';

const formatQueue = (num: number) => 'R' + String(num).padStart(5, '0');

type RegData = Registration & {
  attendee: Attendee;
  tickets: Ticket[];
};

export default function ScannerPage() {
  const lastScanned = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reg, setReg] = useState<RegData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RegData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (decodedText !== lastScanned.current) {
          lastScanned.current = decodedText;
          handleScan(decodedText);
        }
      },
      (error) => {
        // ignore continuous scanning errors
      }
    ).catch((err) => {
      console.error("Camera error:", err);
      setError("Please grant camera permissions to use the scanner.");
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, []);

  const resultPanelRef = useRef<HTMLDivElement>(null);

  const handleScan = async (ticketId: string) => {
    setLoading(true);
    setError('');
    setReg(null);
    
    // Auto scroll to results immediately on scan
    setTimeout(() => {
      resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const res = await getRegistrationByTicketId(ticketId);
    if (res.success && res.registration) {
      setReg(res.registration as RegData);
    } else {
      setError(res.message || 'Invalid QR code.');
      setTimeout(() => { lastScanned.current = null; }, 3000); // Allow rescan after 3s
    }
    
    setLoading(false);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError('');
    setReg(null);
    
    const res = await searchRegistrationManual(searchQuery);
    if (res.success && res.registrations && res.registrations.length > 0) {
      if (res.registrations.length === 1) {
        setReg(res.registrations[0] as RegData);
        setSearchResults([]);
        setTimeout(() => {
          resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setSearchResults(res.registrations as RegData[]);
      }
    } else {
      setSearchResults([]);
      setError('No attendees found matching that search.');
    }
    
    setIsSearching(false);
  };

  const selectSearchResult = (selectedReg: RegData) => {
    setReg(selectedReg);
    setSearchResults([]);
    setTimeout(() => {
      resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleToggle = async (field: 'wristbandCollected' | 'starterPackCollected' | 'allCollected', val: boolean) => {
    if (!reg) return;
    
    // Optimistic UI update
    if (field === 'allCollected') {
      setReg({ ...reg, wristbandCollected: val, starterPackCollected: val });
    } else {
      setReg({ ...reg, [field]: val });
    }
    
    const res = await toggleRegistrationCheckin(reg.id, field, val);
    if (!res.success) {
      // Revert if failed
      setReg({ ...reg, [field]: !val });
      alert("Failed to update status");
    }
  };

  const resetScanner = () => {
    lastScanned.current = null;
    setReg(null);
    setError('');
    setSearchQuery('');
    setSearchResults([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8 bg-[#11181a]">
      <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center bg-[#1c272a] border border-[#8caeb0]/20 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8caeb0]/10 rounded-xl flex items-center justify-center border border-[#8caeb0]/20">
              <QrCodeIcon className="w-5 h-5 text-[#8caeb0]" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Scanner</h1>
              <p className="text-xs text-slate-400 mt-1">Revival Check-in</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              await logoutScanner();
              window.location.href = '/scanner/login';
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline font-medium text-sm">Logout</span>
          </button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Scanner Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#1c272a] border border-[#8caeb0]/20 rounded-2xl overflow-hidden shadow-xl p-4">
            <div id="reader" className="w-full bg-[#11181a] rounded-xl overflow-hidden [&_video]:w-full [&_video]:rounded-xl [&_#reader__dashboard_section_csr]:hidden [&_button]:bg-[#8caeb0] [&_button]:text-[#11181a] [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:font-medium [&_button]:mt-4 [&_select]:bg-[#11181a] [&_select]:text-white [&_select]:border [&_select]:border-[#8caeb0]/20 [&_select]:rounded-md [&_select]:px-3 [&_select]:py-2"></div>
          </div>
          
          {/* Manual Search */}
          <div className="bg-[#1c272a] border border-[#8caeb0]/20 rounded-2xl p-6 shadow-xl">
            <form onSubmit={handleManualSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a4c5c6]" />
                <input
                  type="text"
                  placeholder="Name, Email, or Reg No (e.g. R00015)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#11181a] border border-[#8caeb0]/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#a4c5c6]/50 focus:outline-none focus:border-[#8caeb0]/50 focus:ring-1 focus:ring-[#8caeb0]/50"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSearching || !searchQuery.trim()}
                className="bg-[#8caeb0] text-[#11181a] px-6 py-3 rounded-xl font-bold hover:bg-[#a4c5c6] transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find'}
              </button>
            </form>
            
            {/* Search Results List */}
            {searchResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-2">Select Attendee</h3>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left bg-[#11181a] border border-[#8caeb0]/20 rounded-xl p-4 hover:border-[#8caeb0]/50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-lg">{result.attendee.name}</div>
                      <div className="text-sm text-[#a4c5c6]">{result.attendee.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[#8caeb0] font-bold">{formatQueue(result.orderNumber)}</div>
                      <div className="text-xs text-[#a4c5c6]/70">{result.tickets.length} Tickets</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result Panel */}
        <div ref={resultPanelRef} className="bg-[#1c272a] border border-[#8caeb0]/20 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col relative scroll-mt-6">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#a4c5c6] p-8">
              <Loader2 className="w-12 h-12 text-[#8caeb0] animate-spin mb-4" />
              <p className="text-lg font-medium animate-pulse">Loading Attendee...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-400 bg-red-500/5 p-8 text-center">
              <XCircle className="w-16 h-16 mb-4 opacity-80" />
              <h3 className="text-2xl font-bold mb-2">Scan Failed</h3>
              <p className="opacity-80">{error}</p>
            </div>
          ) : reg ? (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
              <div className="bg-[#8caeb0] border-b border-[#a4c5c6] p-6 flex items-center justify-between text-[#11181a]">
                <div>
                  <h2 className="text-3xl font-black mb-1 leading-none">{reg.attendee.name}</h2>
                  <div className="font-mono font-bold tracking-widest text-lg opacity-80">
                    {formatQueue(reg.orderNumber)}
                  </div>
                </div>
                <div className="bg-[#11181a] text-white px-6 py-3 rounded-2xl border-4 border-[#8caeb0] shadow-lg flex flex-col items-center justify-center">
                  <div className="text-4xl font-black leading-none mb-1">{reg.tickets.length}</div>
                  <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">
                    Ticket{reg.tickets.length !== 1 && 's'}
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-6">
                <div className="bg-[#11181a] border border-[#8caeb0]/20 rounded-xl p-6">
                  <h3 className="text-sm uppercase tracking-wider text-[#a4c5c6] font-semibold mb-4">Collection Tracking</h3>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handleToggle('allCollected', !(reg.wristbandCollected && reg.starterPackCollected))}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                        (reg.wristbandCollected && reg.starterPackCollected)
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-[#1c272a] border-[#8caeb0]/20 text-white hover:border-[#8caeb0]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 font-medium mb-2 sm:mb-0">
                        {(reg.wristbandCollected && reg.starterPackCollected) ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 opacity-50" />}
                        Collection (Wristband & Starter Pack)
                      </div>
                      <div className="flex flex-col sm:items-end text-left sm:text-right">
                        {(reg.wristbandCollected && reg.starterPackCollected) && reg.checkedInAt ? (
                          <div className="text-[10px] sm:text-xs opacity-90 font-mono tracking-tight">
                            {new Date(reg.checkedInAt).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </div>
                        ) : (
                          <div className="text-xs opacity-70">Tap to toggle</div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#8caeb0]/20 bg-[#11181a]">
                <button 
                  onClick={resetScanner}
                  className="w-full bg-[#8caeb0] text-[#11181a] font-bold px-4 py-3 rounded-xl hover:bg-[#a4c5c6] transition-colors"
                >
                  Scan Next Attendee
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#a4c5c6] p-8 text-center">
              <QrCodeIcon className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-[#8caeb0] mb-2">Ready to Scan</h3>
              <p className="text-sm opacity-80">Position a ticket QR code within the frame to view details.</p>
            </div>
          )}
        </div>
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
