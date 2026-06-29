'use client';

import { useState } from 'react';
import { sendPostEventEmailTest, sendPostEventEmailBulk } from '@/actions/admin';
import { Mail, Send, Loader2 } from 'lucide-react';

export default function PostEventEmailControls() {
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleTestSend = async () => {
    const email = prompt("Enter the email address to send the test to:");
    if (!email) return;

    setIsTestLoading(true);
    const res = await sendPostEventEmailTest(email);
    setIsTestLoading(false);

    if (res.success) {
      alert("Test post-event email queued successfully!");
    } else {
      alert("Error: " + res.message);
    }
  };

  const handleBulkSend = async () => {
    if (!confirm("Are you sure you want to send the Post-Event Thank You email to ALL secured attendees?")) return;
    
    setIsBulkLoading(true);
    const res = await sendPostEventEmailBulk();
    setIsBulkLoading(false);

    if (res.success) {
      alert("Bulk post-event email queued successfully!");
    } else {
      alert("Error: " + res.message);
    }
  };

  return (
    <div className="bg-[#1c272a] border border-poster-accent/30 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-poster-accent-bright mb-2">Post-Event Thank You Broadcast</h2>
        <p className="text-[#a4c5c6] text-sm">Send a thank you email with links to photos, testimonies, and merchandise.</p>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={handleTestSend}
          disabled={isTestLoading || isBulkLoading}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all disabled:opacity-50 font-medium"
        >
          {isTestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Send Test
        </button>
        <button
          onClick={handleBulkSend}
          disabled={isTestLoading || isBulkLoading}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-poster-accent hover:bg-poster-accent-bright text-[#11181a] border border-transparent rounded-xl transition-all disabled:opacity-50 font-bold shadow-lg"
        >
          {isBulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Bulk Broadcast
        </button>
      </div>
    </div>
  );
}
