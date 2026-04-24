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
  History,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PhotoDetailModal from '@/components/PhotoDetailModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const SitePhotoSidebar = ({ isOpen, onClose, user }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
        toast({ title: "Success", description: "Photo uploaded." });
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
        description: "Please enable location services to upload photos." 
      });
    });
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e, photoId) => {
    e.stopPropagation();
    setDeleteId(photoId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/site-photos/${deleteId}`, {
        headers: { 'x-auth-token': token }
      });
      setPhotos(prev => prev.filter(p => p._id !== deleteId));
      toast({ title: "Success", description: "Photo deleted." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete photo." });
    } finally {
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
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
    <div className={`fixed right-0 top-0 h-screen transition-all duration-300 ease-in-out bg-white border-l border-slate-200 z-[60] flex flex-col shadow-2xl ${isOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-normal text-slate-800">Site Photos</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 p-6">
        {/* Upload Section */}
        <div className="mb-8 space-y-2">
            <label className="text-[10px] text-slate-400 pl-1 uppercase tracking-wider">New Site Capture</label>
            <div className="relative">
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleUpload}
                    className="hidden" 
                    id="site-photo-upload"
                    disabled={uploading}
                />
                <label 
                    htmlFor="site-photo-upload"
                    className={`flex flex-col items-center justify-center p-8 border border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'border-slate-200 bg-slate-50' : 'border-slate-200 hover:border-yellow-400 hover:bg-yellow-50/30'}`}
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <span className="text-xs font-normal text-slate-500">Tap to capture site photo</span>
                        </>
                    )}
                </label>
            </div>
        </div>

        {/* Photo List */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Recent Captures</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{photos.length} photos</span>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <ImageIcon className="w-6 h-6 text-slate-200 mb-2" />
               <p className="text-[11px] text-slate-400 font-normal">History is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
                {photos.map(photo => (
                  <div 
                    key={photo._id} 
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-all group cursor-pointer"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    <div className="aspect-video w-full relative">
                        <img 
                            src={`${import.meta.env.VITE_API_URL}${photo.imageUrl}`} 
                            alt="Site" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        
                        {(user?._id === photo.user?._id || ['admin', 'subadmin'].includes(user?.role?.name)) && (
                          <button 
                            onClick={(e) => handleDeleteClick(e, photo._id)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                    </div>
                    
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] text-slate-600">{photo.user?.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] text-slate-400">{photo.date}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] text-slate-400">{photo.time}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-2 pt-2 border-t border-slate-50">
                            <MapPin className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                                    {photo.location?.address || `${photo.location?.lat.toFixed(4)}, ${photo.location?.lng.toFixed(4)}`}
                                </p>
                                <a 
                                    href={`https://www.google.com/maps?q=${photo.location?.lat},${photo.location?.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1 text-[9px] text-yellow-600 hover:text-yellow-700 transition-colors"
                                >
                                    View in Maps
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
           <Button 
             variant="ghost" 
             className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 justify-start gap-3 h-11 rounded-lg"
             onClick={() => window.location.href = ['admin', 'subadmin'].includes(user?.role?.name) ? '/admin/site-photos' : '/dashboard/site-photos'}
           >
             <History className="w-4 h-4" />
             <span className="text-xs font-normal">Open Gallery History</span>
           </Button>
        </div>
      </div>

      <PhotoDetailModal 
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommentAdded={handleCommentAdded}
      />

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Photo"
        description="Are you sure you want to remove this site photo? This action cannot be undone."
        confirmText="Delete"
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default SitePhotoSidebar;
