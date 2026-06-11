'use client';

import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VenueMap() {
  return (
    <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto text-white overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 border-b border-white/10 pb-4 flex items-center gap-3"
      >
        <MapPin className="w-8 h-8 text-poster-accent" />
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-poster-accent">
          Venue Map
        </h2>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-300 hover:bg-white/[0.07] transition-colors duration-500 hover:shadow-2xl hover:shadow-poster-accent/5"
      >
        <p className="mb-4 text-sm sm:text-base">
          This is a placeholder for the venue floor plan. 
          Upload an image of your floor plan (Sanctuary, Restrooms, Dining) and replace this section in the code.
        </p>
        <div className="w-full aspect-video bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <span className="text-slate-500 font-medium tracking-widest uppercase">Map Image Placeholder</span>
        </div>
      </motion.div>
    </section>
  );
}
