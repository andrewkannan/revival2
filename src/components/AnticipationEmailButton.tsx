'use client';

import { useState } from 'react';
import { sendTestAnticipationEmail, sendMassAnticipationEmail } from '@/actions/admin';
import { Mail, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AnticipationEmailButton() {
  const [testEmail, setTestEmail] = useState('kannanandrew101@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{success: boolean, message: string} | null>(null);

  const [isSendingMass, setIsSendingMass] = useState(false);
  const [massStatus, setMassStatus] = useState<{success: boolean, message: string} | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    setTestStatus(null);
    try {
      const res = await sendTestAnticipationEmail(testEmail);
      if (res.success) {
        setTestStatus({ success: true, message: 'Test email sent!' });
      } else {
        setTestStatus({ success: false, message: res.message || 'Failed to send test email.' });
      }
    } catch (error: any) {
      setTestStatus({ success: false, message: error.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendMass = async () => {
    setIsSendingMass(true);
    setMassStatus(null);
    setShowConfirm(false);
    try {
      const res = await sendMassAnticipationEmail();
      if (res.success) {
        setMassStatus({ success: true, message: res.message || 'Emails sent successfully!' });
      } else {
        setMassStatus({ success: false, message: res.message || 'Failed to send mass emails.' });
      }
    } catch (error: any) {
      setMassStatus({ success: false, message: error.message });
    } finally {
      setIsSendingMass(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 mt-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-poster-accent/10 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-poster-accent" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">7 Days Left Email Campaign</h3>
          <p className="text-sm text-slate-400">Send an anticipation email with a live countdown to all secured ticket holders.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Test Email Section */}
        <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">1. Send Test</label>
          <div className="flex gap-2">
            <input 
              type="email" 
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-poster-accent/50 focus:outline-none"
              placeholder="Test email address"
            />
            <button
              onClick={handleSendTest}
              disabled={isSendingTest || !testEmail}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Test'}
            </button>
          </div>
          {testStatus && (
            <p className={\`text-xs flex items-center gap-1 \${testStatus.success ? 'text-emerald-400' : 'text-red-400'}\`}>
              {testStatus.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {testStatus.message}
            </p>
          )}
        </div>

        {/* Mass Email Section */}
        <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">2. Blast to All Secured</label>
          
          {showConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-amber-400 font-medium">Are you sure? This will send emails to ALL approved attendees.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleSendMass}
                  className="bg-poster-accent text-poster-bg px-4 py-2 rounded-lg text-sm font-bold flex-1 hover:bg-poster-accent-bright transition-colors"
                >
                  Yes, Send Now
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isSendingMass}
                className="w-full bg-poster-accent/20 border border-poster-accent/50 text-poster-accent hover:bg-poster-accent hover:text-poster-bg px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingMass ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Blast Mass Email</>}
              </button>
            </div>
          )}

          {massStatus && (
            <p className={\`text-xs flex items-center gap-1 \${massStatus.success ? 'text-emerald-400' : 'text-red-400'}\`}>
              {massStatus.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {massStatus.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
