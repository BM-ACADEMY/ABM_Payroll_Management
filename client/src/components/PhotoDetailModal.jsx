import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { 
  Send, 
  X, 
  User, 
  Clock, 
  MessageSquare,
  Maximize2
} from "lucide-react";
import { format } from 'date-fns';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

const PhotoDetailModal = ({ photo, isOpen, onClose, onCommentAdded }) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!photo) return null;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/site-photos/${photo._id}/comments`, 
        { text: commentText },
        { headers: { 'x-auth-token': token } }
      );
      
      onCommentAdded(photo._id, res.data);
      setCommentText('');
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add comment" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] p-0 overflow-hidden bg-black border-zinc-800 rounded-3xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div className="flex-1 bg-black relative flex items-center justify-center p-4">
            <img 
              src={`${import.meta.env.VITE_API_URL}${photo.imageUrl}`} 
              alt="Site Capture Full" 
              className="max-h-full max-w-full object-contain cursor-zoom-in"
              onClick={() => window.open(`${import.meta.env.VITE_API_URL}${photo.imageUrl}`, '_blank')}
            />
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white/70 flex items-center gap-2">
                <Maximize2 className="w-3 h-3" />
                Click image to open full resolution
            </div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comment & Info Section */}
          <div className="w-full md:w-[380px] bg-white h-full flex flex-col border-l border-gray-100">
            <div className="p-6 border-b border-gray-100 h-fit bg-zinc-50/50">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#fffe01] flex items-center justify-center text-xs font-bold text-black border-2 border-white shadow-sm">
                      {photo.user?.name?.charAt(0)}
                  </div>
                  <div>
                      <h3 className="text-sm font-bold text-gray-900">{photo.user?.name}</h3>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{photo.date} • {photo.time}</p>
                  </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-100 text-[11px] text-gray-500 leading-relaxed shadow-sm italic">
                  Captured at {photo.location?.address || 'Restricted Location'}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
               <div className="p-4 bg-zinc-50/50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Discussion</span>
                  </div>
                  <Badge className="bg-zinc-200 text-zinc-600 border-none text-[9px]">
                      {photo.comments?.length || 0}
                  </Badge>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {(!photo.comments || photo.comments.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="w-8 h-8 text-zinc-200 mb-3" />
                        <p className="text-xs text-zinc-400 font-medium">No comments yet.<br/>Be the first to speak!</p>
                    </div>
                  ) : (
                    photo.comments.map((comment, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0 border border-white isolate mt-0.5">
                            {comment.userName?.charAt(0)}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[11px] font-bold text-gray-900">{comment.userName}</span>
                                <span className="text-[9px] text-zinc-400 font-medium">{format(new Date(comment.createdAt), 'MMM d, p')}</span>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-2xl rounded-tl-none border border-zinc-100 text-[12px] text-gray-600 leading-normal">
                                {comment.text}
                            </div>
                        </div>
                      </div>
                    ))
                  )}
               </div>

               <div className="p-6 border-t border-gray-100 bg-white">
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Input 
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="bg-gray-50 border-none h-11 text-xs focus-visible:ring-[#fffe01] rounded-xl"
                        disabled={isSubmitting}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={isSubmitting || !commentText.trim()}
                        className="bg-[#fffe01] hover:bg-black text-black hover:text-white transition-all h-11 w-11 shrink-0 rounded-xl"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                  </form>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
      `}</style>
    </Dialog>
  );
};

export default PhotoDetailModal;
