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
        className="w-full relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors duration-500 hover:shadow-2xl hover:shadow-poster-accent/10"
      >
        <div className="relative w-full aspect-[16/9]">
          <img 
            src="/isometric-venue.png" 
            alt="3D Venue Map" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
}
