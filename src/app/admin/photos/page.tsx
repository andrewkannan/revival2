'use client';

import { useState, useEffect } from 'react';
import { uploadPhoto, getPhotos, deletePhoto, deleteAllPhotos } from '@/actions/photos';
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

  const compressImageFile = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
              resolve(newFile);
            } else {
              reject(new Error("Canvas to Blob failed"));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      let failedCount = 0;
      
      for (const file of Array.from(files)) {
        try {
          const compressedFile = await compressImageFile(file);
          const formData = new FormData();
          formData.append('file', compressedFile);
          
          const r = await uploadPhoto(formData);
          if (r.success && r.photo) {
            // Update UI immediately for each successful photo
            setPhotos(prev => [r.photo, ...prev]);
          } else {
            failedCount++;
          }
        } catch (e) {
          console.error(e);
          failedCount++;
        }
      }
      
      if (failedCount > 0) {
        setError(`Failed to upload ${failedCount} photo(s). Check your AWS credentials or network.`);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
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

  const handleDeleteAll = async () => {
    const pwd = prompt("Enter password to delete ALL photos:");
    if (!pwd) return;

    const res = await deleteAllPhotos(pwd);
    if (res.success) {
      setPhotos([]);
      alert("All photos deleted successfully.");
    } else {
      setError(res.message || "Failed to delete photos. Invalid password?");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photo Gallery</h1>
          <p className="text-slate-400 mt-2">Manage photos displayed on the itinerary page.</p>
        </div>
        {photos.length > 0 && (
          <button 
            onClick={handleDeleteAll}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete All
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-[#1c272a]/50 border border-white/10 rounded-2xl p-8 text-center border-dashed relative">
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Upload Photos</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Upload multiple high-quality JPG or PNG images at once. They will be uploaded directly to AWS S3.
        </p>
        
        <label className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${isUploading ? 'bg-poster-accent/50 cursor-not-allowed text-white' : 'bg-poster-accent hover:bg-poster-accent-bright text-poster-bg'}`}>
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading...</>
          ) : (
            'Select Images'
          )}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            multiple
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
              <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-[8.5/11]">
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
