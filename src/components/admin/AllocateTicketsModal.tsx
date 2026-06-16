'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, User, Mail, Users } from 'lucide-react';
import { Ticket, TicketType, Attendee } from '@prisma/client';
import { allocateTickets } from '@/actions/admin';

interface Props {
  registrationId: string;
  orderNumber: number;
  tickets: Ticket[];
  attendee: Attendee;
  onClose: () => void;
}

export default function AllocateTicketsModal({ registrationId, orderNumber, tickets, attendee, onClose }: Props) {
  const [formData, setFormData] = useState(
    tickets.map((t, index) => ({
      ticketId: t.id,
      ticketType: t.ticketType,
      attendeeName: t.attendeeName || (index === 0 ? attendee.name : ''),
      attendeeEmail: t.attendeeEmail || (index === 0 ? attendee.email : '')
    }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await allocateTickets(registrationId, formData.map(f => ({
        ticketId: f.ticketId,
        attendeeName: f.attendeeName,
        attendeeEmail: f.attendeeEmail
      })));
      
      if (res.success) {
        onClose();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert("Error allocating tickets: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (index: number, field: 'attendeeName' | 'attendeeEmail', value: string) => {
    const newData = [...formData];
    newData[index][field] = value;
    setFormData(newData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col bg-[#1c272a] border border-white/20 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-poster-accent" />
              Allocate Tickets
            </h2>
            <p className="text-slate-400 text-sm mt-1">Order #R{String(orderNumber).padStart(5, '0')}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-4 bg-black/20">
          <p className="text-sm text-slate-300 mb-6">
            Manually assign names and emails to individual tickets. This is for your records.
          </p>

          {formData.map((ticket, idx) => (
            <div key={ticket.ticketId} className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold bg-white/10 text-white rounded-md">
                  Ticket {idx + 1}
                </span>
                <span className={`text-xs font-bold ${ticket.ticketType === 'ADULT' ? 'text-blue-400' : 'text-orange-400'}`}>
                  {ticket.ticketType}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    value={ticket.attendeeName}
                    onChange={(e) => updateField(idx, 'attendeeName', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-poster-accent focus:ring-1 focus:ring-poster-accent outline-none transition-all placeholder:text-slate-600"
                    placeholder="E.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email (Optional)
                  </label>
                  <input 
                    type="email" 
                    value={ticket.attendeeEmail}
                    onChange={(e) => updateField(idx, 'attendeeEmail', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-poster-accent focus:ring-1 focus:ring-poster-accent outline-none transition-all placeholder:text-slate-600"
                    placeholder="E.g. john@example.com"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-transparent border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-poster-accent hover:bg-[#b8e65a] text-black rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Allocations'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
