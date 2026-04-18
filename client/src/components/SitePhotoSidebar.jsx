import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Camera, 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Loader2, 
  Upload,
  Image as ImageIcon,
  User,
  History
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PhotoDetailModal from '@/components/PhotoDetailModal';

const SitePhotoSidebar = ({ isOpen, onClose, user }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/site-photos`, {
        headers: { 'x-auth-token': token }
      });
      setPhotos(res.data.photos);
    } catch (err) {
      console.error('Failed to fetch site photos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      fetchPhotos();
    }
  }, [user, isOpen]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Invalid File", description: "Please upload an image." });
        return;
    }

    setUploading(true);
    
    // Get Geolocation
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('date', date);
      formData.append('day', day);
      formData.append('time', time);
      formData.append('lat', latitude);
      formData.append('lng', longitude);

      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/site-photos`, formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        setPhotos(prev => [res.data, ...prev]);
        toast({ title: "Success", description: "Site photo uploaded successfully." });
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to upload photo." });
      } finally {
        setUploading(false);
      }
    }, (error) => {
      setUploading(false);
      toast({ 
        variant: "destructive", 
        title: "Location Error", 
        description: "Please enable location services to upload site photos." 
      });
    });
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCommentAdded = (photoId, newComment) => {
    setPhotos(prevPhotos => prevPhotos.map(p => 
      p._id === photoId 
        ? { ...p, comments: [...(p.comments || []), newComment] }
        : p
    ));
    if (selectedPhoto && selectedPhoto._id === photoId) {
        setSelectedPhoto(prev => ({
            ...prev,
            comments: [...(prev.comments || []), newComment]
        }));
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-screen transition-all duration-300 ease-in-out bg-black border-l border-zinc-800 z-[60] flex flex-col shadow-2xl ${isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#fffe01]" />
          <h2 className="text-lg font-medium text-white italic tracking-tight">Site Photos</h2>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 p-6">
        {/* Upload Section */}
        <div className="mb-8">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1 block mb-3">Upload New Image</label>
            <div className="relative">
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" // Suggest using camera on mobile
                    onChange={handleUpload}
                    className="hidden" 
                    id="site-photo-upload"
                    disabled={uploading}
                />
                <label 
                    htmlFor="site-photo-upload"
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-800 hover:border-[#fffe01] hover:bg-[#fffe01]/5'}`}
                >
                    {uploading ? (
                        <Loader2 className="w-8 h-8 text-[#fffe01] animate-spin" />
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6 text-zinc-400" />
                            </div>
                            <span className="text-xs font-medium text-zinc-400">Click to capture or upload</span>
                        </>
                    )}
                </label>
            </div>
        </div>

        {/* Photo List */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-3 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Recent Photos</span>
            <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 rounded-md h-5 flex items-center capitalize">
                {photos.length} Total
            </span>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-zinc-700 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
               <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                  <ImageIcon className="w-4 h-4 text-zinc-600 opacity-30" />
               </div>
               <p className="text-xs text-zinc-500 font-medium">No photos uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
                {photos.map(photo => (
                  <div 
                    key={photo._id} 
                    className="bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl hover:bg-[#18181b] transition-all group cursor-pointer"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    <div className="aspect-video w-full relative group">
                        <img 
                            src={`${import.meta.env.VITE_API_URL}${photo.imageUrl}`} 
                            alt="Site" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-[#fffe01]" />
                                <span className="text-[10px] font-bold text-white uppercase">{photo.user?.name}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-400">{photo.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-400">{photo.time}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-1.5 pt-2 border-t border-zinc-800/50">
                            <MapPin className="w-3.5 h-3.5 text-[#fffe01] flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                    {photo.location?.address || `${photo.location?.lat.toFixed(4)}, ${photo.location?.lng.toFixed(4)}`}
                                </p>
                                <a 
                                    href={`https://www.google.com/maps?q=${photo.location?.lat},${photo.location?.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-[#fffe01] hover:underline font-bold uppercase tracking-tighter"
                                >
                                    Open in Maps
                                </a>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="mt-6 border-t border-zinc-800 pt-6">
           <Button 
             variant="ghost" 
             className="w-full text-zinc-400 hover:text-[#fffe01] hover:bg-zinc-900 justify-start gap-3 h-12 rounded-xl"
             onClick={() => window.location.href = ['admin', 'subadmin'].includes(user?.role?.name) ? '/admin/site-photos' : '/dashboard/site-photos'}
           >
             <History className="w-5 h-5" />
             <span className="text-xs font-medium uppercase tracking-wider">Full History</span>
           </Button>
        </div>
      </div>

      <PhotoDetailModal 
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommentAdded={handleCommentAdded}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};

export default SitePhotoSidebar;
