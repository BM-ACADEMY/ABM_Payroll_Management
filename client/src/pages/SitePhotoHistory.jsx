import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Search, 
  Calendar, 
  Filter, 
  MapPin, 
  User, 
  Clock, 
  ExternalLink,
  ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";
import PhotoDetailModal from '@/components/PhotoDetailModal';

const SitePhotoHistory = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [userRole] = useState(sessionStorage.getItem('userRole'));
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchPhotos = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/api/site-photos?page=${page}&limit=12&startDate=${startDate}&endDate=${endDate}&userName=${searchTerm}`;

      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setPhotos(res.data.photos);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch site photos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchPhotos(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, startDate, endDate]);

  const handlePageChange = (page) => {
    fetchPhotos(page);
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
    // Also update selectedPhoto if it's the one that was open
    if (selectedPhoto && selectedPhoto._id === photoId) {
        setSelectedPhoto(prev => ({
            ...prev,
            comments: [...(prev.comments || []), newComment]
        }));
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Site Photo <span className="text-zinc-400">History</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal">
            {userRole === 'admin' ? 'Monitor all site visits and location-tagged images' : 'Review your historical site visit captures'}
          </p>
        </div>
      </header>

      {/* Filters */}
      <Card className="bg-white border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-zinc-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Filters</span>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                {userRole === 'admin' ? 'Employee Name' : 'Search Details'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#fffe01]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#fffe01]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#fffe01]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader size="lg" color="red" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl text-gray-400 font-medium flex flex-col items-center gap-4">
           <ImageIcon className="w-12 h-12 opacity-20" />
           <p>No site photos found for this period.</p>
        </div>
      ) : (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {photos.map((photo) => (
                    <Card 
                        key={photo._id} 
                        className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl group bg-white cursor-pointer"
                        onClick={() => handlePhotoClick(photo)}
                    >
                        <div className="aspect-[4/3] relative overflow-hidden bg-zinc-100">
                            <img 
                                src={`${import.meta.env.VITE_API_URL}${photo.imageUrl}`} 
                                alt="Site Capture" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                                <Badge className="bg-black/60 backdrop-blur-md text-white border-none text-[10px] py-1">
                                    {photo.day}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#fffe01] text-black flex items-center justify-center text-[10px] font-bold">
                                        {photo.user?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{photo.user?.name}</span>
                                        <span className="text-[9px] text-zinc-400 uppercase font-medium tracking-tighter">{photo.user?.employeeId}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                                        <span className="text-[10px] font-bold text-gray-600">{photo.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                        <span className="text-[10px] font-medium text-zinc-400">{photo.time}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-50 space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-[#fffe01] mt-0.5 shrink-0" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                            {photo.location?.address || `${photo.location?.lat.toFixed(6)}, ${photo.location?.lng.toFixed(6)}`}
                                        </p>
                                        <a 
                                            href={`https://www.google.com/maps?q=${photo.location?.lat},${photo.location?.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-tighter w-fit"
                                        >
                                            View on map <ExternalLink className="w-2 h-2" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-zinc-50/50 border-gray-100 rounded-2xl">
                <CardContent className="p-4">
                    <PaginationControl
                        pagination={pagination}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>
        </div>
      )}

      <PhotoDetailModal 
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default SitePhotoHistory;
