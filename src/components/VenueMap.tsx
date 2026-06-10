import { MapPin } from 'lucide-react';

export default function VenueMap() {
  return (
    <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto text-white">
      <div className="mb-8 border-b border-white/10 pb-4 flex items-center gap-3">
        <MapPin className="w-8 h-8 text-poster-accent" />
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-poster-accent">
          Venue Map
        </h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-300">
        <p className="mb-4 text-sm sm:text-base">
          This is a placeholder for the venue floor plan. 
          Upload an image of your floor plan (Sanctuary, Restrooms, Dining) and replace this section in the code.
        </p>
        <div className="w-full aspect-video bg-black/40 rounded-xl border border-white/5 flex items-center justify-center">
          <span className="text-slate-500 font-medium tracking-widest uppercase">Map Image Placeholder</span>
        </div>
      </div>
    </section>
  );
}
