'use client';

import { useState } from 'react';
import { Calendar, Heart, MessageSquare } from 'lucide-react';
import Itinerary from '@/components/Itinerary';
import VenueMap from '@/components/VenueMap';
import PrayerWall from '@/components/PrayerWall';
import TestimonyBox from '@/components/TestimonyBox';

interface Props {
  initialPrayers: any[];
}

export default function ItineraryTabs({ initialPrayers }: Props) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'prayer' | 'testimony'>('schedule');

  return (
    <div className="w-full">
      {/* Sticky Tabs Navbar */}
      <div className="sticky top-0 z-40 bg-[#263336]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'schedule' ? 'border-poster-accent text-poster-accent' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider">Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('prayer')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'prayer' ? 'border-poster-accent text-poster-accent' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider">Prayer Wall</span>
          </button>
          <button
            onClick={() => setActiveTab('testimony')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'testimony' ? 'border-poster-accent text-poster-accent' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wider">Testimonies</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-8 pb-24">
        {activeTab === 'schedule' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Itinerary />
            <VenueMap />
          </div>
        )}
        
        {activeTab === 'prayer' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PrayerWall initialPrayers={initialPrayers} />
          </div>
        )}

        {activeTab === 'testimony' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TestimonyBox />
          </div>
        )}
      </div>
    </div>
  );
}
