'use client';

import { useState, useEffect } from 'react';
import { uploadPhoto, getPhotos, deletePhoto } from '@/actions/photos';
import { Upload, Image as ImageIcon, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setIsLoading(true);
    const res = await getPhotos();
    if (res.success) {
      setPhotos(res.data!);
    } else {
      setError(res.message || "Failed to load photos");
    }
    setIsLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadPhoto(formData);
      if (res.success) {
        setPhotos([res.photo, ...photos]);
      } else {
        setError(res.message || "Failed to upload photo");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    
    const res = await deletePhoto(id);
    if (res.success) {
      setPhotos(photos.filter(p => p.id !== id));
    } else {
      setError(res.message || "Failed to delete photo");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photo Gallery</h1>
          <p className="text-slate-400 mt-2">Manage photos displayed on the itinerary page.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-[#1c272a]/50 border border-white/10 rounded-2xl p-8 text-center border-dashed relative">
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Upload a New Photo</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Upload high-quality JPG or PNG images. They will be uploaded directly to AWS S3.
        </p>
        
        <label className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${isUploading ? 'bg-poster-accent/50 cursor-not-allowed text-white' : 'bg-poster-accent hover:bg-poster-accent-bright text-poster-bg'}`}>
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading...</>
          ) : (
            'Select Image'
          )}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-slate-400" /> Uploaded Photos ({photos.length})
        </h2>
        
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-poster-accent animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-black/20">
            <p className="text-slate-500">No photos uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photo.imageUrl} 
                  alt="Gallery image" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={() => handleDelete(photo.id)}
                    className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-full transition-colors"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
