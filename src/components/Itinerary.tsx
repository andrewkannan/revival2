'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// SGT timezone is +08:00
const schedule = [
  {
    day: 'Day 1',
    date: 'Friday • 26 June 2026',
    events: [
      { 
        time: '6:00pm - 7:30pm', 
        title: 'Registration', 
        description: '',
        start: '2026-06-26T18:00:00+08:00',
        end: '2026-06-26T19:30:00+08:00'
      },
      { 
        time: '7:30pm - 10pm', 
        title: 'Session 1 - Night Rally', 
        description: '',
        start: '2026-06-26T19:30:00+08:00',
        end: '2026-06-26T22:00:00+08:00'
      }
    ]
  },
  {
    day: 'Day 2',
    date: 'Saturday • 27 June 2026',
    events: [
      { 
        time: '9am - 12pm', 
        title: 'Session 2', 
        description: '',
        start: '2026-06-27T09:00:00+08:00',
        end: '2026-06-27T12:00:00+08:00'
      },
      { 
        time: '1:30pm - 3pm', 
        title: 'Breakout Sessions', 
        description: 'Auditorium 2: Revival in Marketplace\nAuditorium 3: Hosting the Glory',
        start: '2026-06-27T13:30:00+08:00',
        end: '2026-06-27T15:00:00+08:00'
      },
      { 
        time: '7:00pm - 10pm', 
        title: 'Session 3 - Night Rally', 
        description: '',
        start: '2026-06-27T19:00:00+08:00',
        end: '2026-06-27T22:00:00+08:00'
      }
    ]
  },
  {
    day: 'Day 3',
    date: 'Sunday • 28 June 2026',
    events: [
      { 
        time: '8:30am - 12pm', 
        title: 'Session 4', 
        description: '',
        start: '2026-06-28T08:30:00+08:00',
        end: '2026-06-28T12:00:00+08:00'
      }
    ]
  }
];

export default function Itinerary() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client side to avoid hydration mismatches
    setCurrentTime(new Date());
    
    // Update the time every minute to keep the highlighting accurate
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const isEventActive = (startStr: string, endStr: string) => {
    if (!currentTime) return false;
    const start = new Date(startStr);
    const end = new Date(endStr);
    return currentTime >= start && currentTime < end;
  };

  const isDayActive = (events: typeof schedule[0]['events']) => {
    return events.some(event => isEventActive(event.start, event.end));
  };

  return (
    <section id="itinerary" className="pt-12 pb-24 px-6 md:px-12 max-w-4xl mx-auto text-white relative scroll-mt-20">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-poster-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center mb-16 relative z-10 flex flex-col items-center">

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-extrabold mb-4 tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-poster-accent-bright to-white"
        >
          Itinerary
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 font-light text-lg tracking-wide max-w-xl mx-auto"
        >
          Here's what we have in store for the REVIVAL conference.
        </motion.p>
      </div>

      <div className="relative ml-4 md:ml-12 z-10">
        {/* Continuous sleek line */}
        <div className="absolute left-0 top-2 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        <div className="space-y-20">
          {schedule.map((dayPlan, dayIndex) => {
            const dayActive = isDayActive(dayPlan.events);
            
            return (
              <div key={dayPlan.day} className="relative">
                {/* Sleek animated glowing dot for the day */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  className={`absolute -left-[5px] top-2 w-3 h-3 rounded-full transition-colors duration-500 ${dayActive ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-poster-accent-bright shadow-[0_0_15px_rgba(140,174,176,0.8)]'}`}
                >
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-40 ${dayActive ? 'bg-white' : 'bg-poster-accent-bright'}`} />
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  className="pl-10 md:pl-16 mb-10 flex flex-col md:flex-row md:items-end gap-2 md:gap-4"
                >
                  <h3 className={`text-3xl md:text-4xl font-extrabold tracking-widest uppercase transition-colors duration-500 ${dayActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-transparent bg-clip-text bg-gradient-to-r from-poster-accent-bright to-white'}`}>
                    {dayPlan.day}
                  </h3>
                  <span className={`text-sm md:text-base font-semibold tracking-widest uppercase md:pb-1 transition-colors duration-500 ${dayActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {dayPlan.date}
                  </span>
                </motion.div>

                <div className="space-y-8 pl-10 md:pl-16">
                  {dayPlan.events.map((event, eventIndex) => {
                    const isActive = isEventActive(event.start, event.end);
                    
                    return (
                      <motion.div 
                        key={event.title + event.time}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ delay: eventIndex * 0.1, duration: 0.5, ease: "easeOut" }}
                        className={`group relative border rounded-3xl p-6 md:p-8 backdrop-blur-md transition-all duration-500 overflow-hidden ${
                          isActive 
                            ? 'bg-gradient-to-br from-white/10 to-transparent border-white/30 shadow-lg shadow-white/10 scale-[1.02]' 
                            : 'bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-poster-accent/5'
                        }`}
                      >
                        {/* Hover/Active glare effect */}
                        <div className={`absolute inset-0 bg-gradient-to-tr from-transparent to-transparent pointer-events-none transition-opacity duration-700 ${isActive ? 'via-white/10 opacity-100' : 'via-white/[0.05] opacity-0 group-hover:opacity-100'}`} />

                        <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                          <div className={`inline-flex px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase items-center gap-2 ${
                            isActive 
                              ? 'bg-white/20 border-white/40 text-white' 
                              : 'bg-poster-accent/10 border-poster-accent/20 text-poster-accent-bright'
                          }`}>
                            {isActive && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                            )}
                            {event.time}
                          </div>
                          <h4 className={`text-xl md:text-2xl font-semibold tracking-wide ${isActive ? 'text-white' : 'text-white/95'}`}>
                            {event.title}
                          </h4>
                          
                          {isActive && (
                            <div className="md:ml-auto inline-flex items-center text-white text-sm font-semibold tracking-wider uppercase border border-white/30 px-3 py-1 rounded-full bg-white/10">
                              Happening Now
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className={`font-light leading-relaxed relative z-10 whitespace-pre-line mt-4 ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                            {event.description}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
