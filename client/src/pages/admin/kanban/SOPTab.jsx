import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  GitBranch, 
  FileText, 
  Paperclip, 
  Upload, 
  X, 
  ExternalLink, 
  File, 
  FileCode, 
  Image as ImageIcon,
  Save,
  Edit2,
  Plus,
  Trash2,
  Link2
} from "lucide-react";
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

const SOPTab = ({ boardData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Normalize incoming data from Board model (handles migration from single string links to arrays)
  const initialSop = boardData?.sop || {};
  const [sopData, setSopData] = useState({
    gitLinks: Array.isArray(initialSop.gitLinks) ? initialSop.gitLinks : (initialSop.gitLink ? [{ label: 'Main Repository', url: initialSop.gitLink }] : []),
    googleDocLinks: Array.isArray(initialSop.googleDocLinks) ? initialSop.googleDocLinks : (initialSop.googleDocLink ? [{ label: 'Shared Document', url: initialSop.googleDocLink }] : []),
    description: initialSop.description || '',
    attachments: initialSop.attachments || []
  });

  const { toast } = useToast();
  const isVirtualBoard = boardData?._id === 'weekly-aggregated';

  // Sync state if boardData changes from outside (e.g. after save)
  useEffect(() => {
     if (boardData?.sop) {
        const s = boardData.sop;
        setSopData({
           gitLinks: Array.isArray(s.gitLinks) ? s.gitLinks : (s.gitLink ? [{ label: 'Main Repository', url: s.gitLink }] : []),
           googleDocLinks: Array.isArray(s.googleDocLinks) ? s.googleDocLinks : (s.googleDocLink ? [{ label: 'Shared Document', url: s.googleDocLink }] : []),
           description: s.description || '',
           attachments: s.attachments || []
        });
     }
  }, [boardData]);

  const handleSave = async () => {
    if (isVirtualBoard) {
      toast({ variant: "destructive", title: "Action Restricted", description: "Procedural SOPs must be modified within individual project boards." });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/${boardData._id}`, {
        sop: sopData
      }, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "SOP manifest updated" });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update SOP" });
    } finally {
      setLoading(false);
    }
  };

  const addLink = (type) => {
     setSopData(prev => ({
        ...prev,
        [type === 'git' ? 'gitLinks' : 'googleDocLinks']: [
           ...prev[type === 'git' ? 'gitLinks' : 'googleDocLinks'],
           { label: '', url: '' }
        ]
     }));
  };

  const removeLink = (type, index) => {
     setSopData(prev => ({
        ...prev,
        [type === 'git' ? 'gitLinks' : 'googleDocLinks']: prev[type === 'git' ? 'gitLinks' : 'googleDocLinks'].filter((_, i) => i !== index)
     }));
  };

  const updateLink = (type, index, field, value) => {
     const links = [...sopData[type === 'git' ? 'gitLinks' : 'googleDocLinks']];
     links[index][field] = value;
     setSopData(prev => ({ ...prev, [type === 'git' ? 'gitLinks' : 'googleDocLinks']: links }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      });

      const updatedSop = {
        ...sopData,
        attachments: [...(sopData.attachments || []), { name: res.data.name, url: res.data.url, fileType: res.data.fileType }]
      };
      
      setSopData(updatedSop);
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/${boardData._id}`, { sop: updatedSop }, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Resource uploaded" });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Upload failed" });
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = async (index) => {
    const updatedSop = { ...sopData, attachments: sopData.attachments.filter((_, i) => i !== index) };
    setSopData(updatedSop);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/${boardData._id}`, { sop: updatedSop }, {
        headers: { 'x-auth-token': token }
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove asset" });
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return <ImageIcon className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('javascript') || type.includes('json') || type.includes('html')) return <FileCode className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-normal tracking-tight text-zinc-900 mb-2">Standard <span className="text-zinc-300">Operating Procedure</span></h2>
          <p className="text-zinc-500 font-medium tracking-tight">Technical guidelines & repository manifest</p>
        </div>
        {!isVirtualBoard && (
          <Button 
            variant={isEditing ? "default" : "outline"} 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`rounded-2xl h-12 px-8 font-normal transition-all shadow-sm ${isEditing ? 'bg-black text-[#fffe01] hover:bg-zinc-800' : 'border-zinc-200'}`}
            disabled={loading}
          >
            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
            {isEditing ? "Save Protocol" : "Modify SOP"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <FileText className="w-5 h-5 text-zinc-400" />
               <h3 className="text-sm font-normal uppercase tracking-widest text-zinc-400">Documentation & Workflow</h3>
            </div>
            {isEditing ? (
              <Textarea 
                value={sopData.description}
                onChange={(e) => setSopData({...sopData, description: e.target.value})}
                placeholder="Enter board guidelines, deployment processes, or list instructions here..."
                className="min-h-[400px] rounded-3xl border-zinc-100 bg-zinc-50/50 p-6 text-sm font-normal leading-relaxed focus:bg-white transition-all custom-scrollbar"
              />
            ) : (
              <div className="min-h-[400px] whitespace-pre-wrap text-sm font-normal text-zinc-600 leading-relaxed bg-zinc-50/30 p-8 rounded-3xl border border-dashed border-zinc-100">
                {sopData.description || (isVirtualBoard ? "Navigate to a specific project board to manage protocols." : "No procedural guidelines defined yet.")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Environment Links</h3>
                {isEditing && (
                   <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg bg-zinc-50 hover:bg-zinc-100" onClick={() => addLink('git')} title="Add Git Link">
                         <GitBranch className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg bg-zinc-50 hover:bg-zinc-100" onClick={() => addLink('doc')} title="Add Doc Link">
                         <FileText className="w-3 h-3" />
                      </Button>
                   </div>
                )}
             </div>
             
             <div className="space-y-6">
                {/* Git Links */}
                <div className="space-y-3">
                   <Label className="text-[10px] font-normal uppercase tracking-widest text-zinc-400 flex items-center gap-2 ml-1">Repositories</Label>
                   {sopData.gitLinks?.length === 0 && !isEditing && <p className="text-[10px] text-zinc-300 italic ml-1">No repositories linked</p>}
                   {sopData.gitLinks?.map((link, i) => (
                      <div key={i} className="space-y-1 group">
                         <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                               {isEditing ? (
                                  <>
                                     <Input 
                                        value={link.label}
                                        onChange={(e) => updateLink('git', i, 'label', e.target.value)}
                                        placeholder="Label (e.g. Backend)"
                                        className="h-8 rounded-lg text-[10px] border-zinc-100 font-normal bg-zinc-50/50"
                                     />
                                     <Input 
                                        value={link.url}
                                        onChange={(e) => updateLink('git', i, 'url', e.target.value)}
                                        placeholder="URL"
                                        className="h-8 rounded-lg text-[10px] border-zinc-100 font-normal bg-zinc-50/50"
                                     />
                                  </>
                               ) : (
                                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:bg-white hover:border-zinc-200 transition-all cursor-pointer" onClick={() => window.open(link.url, '_blank')}>
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                           <GitBranch className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[11px] font-normal text-zinc-900">{link.label || 'Unnamed Link'}</span>
                                           <span className="text-[8px] text-zinc-400 truncate max-w-[120px]">{link.url}</span>
                                        </div>
                                     </div>
                                     <ExternalLink className="w-3 h-3 text-zinc-300" />
                                  </div>
                               )}
                            </div>
                            {isEditing && (
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 self-end mb-1" onClick={() => removeLink('git', i)}>
                                  <Trash2 className="w-3 h-3" />
                               </Button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>

                {/* Google Doc Links */}
                <div className="space-y-3">
                   <Label className="text-[10px] font-normal uppercase tracking-widest text-zinc-400 flex items-center gap-2 ml-1">Documentation</Label>
                   {sopData.googleDocLinks?.length === 0 && !isEditing && <p className="text-[10px] text-zinc-300 italic ml-1">No documents linked</p>}
                   {sopData.googleDocLinks?.map((link, i) => (
                      <div key={i} className="space-y-1 group">
                         <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                               {isEditing ? (
                                  <>
                                     <Input 
                                        value={link.label}
                                        onChange={(e) => updateLink('doc', i, 'label', e.target.value)}
                                        placeholder="Label (e.g. Design Doc)"
                                        className="h-8 rounded-lg text-[10px] border-zinc-100 font-normal bg-zinc-50/50"
                                     />
                                     <Input 
                                        value={link.url}
                                        onChange={(e) => updateLink('doc', i, 'url', e.target.value)}
                                        placeholder="URL"
                                        className="h-8 rounded-lg text-[10px] border-zinc-100 font-normal bg-zinc-50/50"
                                     />
                                  </>
                               ) : (
                                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:bg-white hover:border-zinc-200 transition-all cursor-pointer" onClick={() => window.open(link.url, '_blank')}>
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                           <FileText className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[11px] font-normal text-zinc-900">{link.label || 'Unnamed Document'}</span>
                                           <span className="text-[8px] text-zinc-400 truncate max-w-[120px]">{link.url}</span>
                                        </div>
                                     </div>
                                     <ExternalLink className="w-3 h-3 text-zinc-300" />
                                  </div>
                               )}
                            </div>
                            {isEditing && (
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 self-end mb-1" onClick={() => removeLink('doc', i)}>
                                  <Trash2 className="w-3 h-3" />
                               </Button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">Resources</h3>
                {!isVirtualBoard && (
                  <div className="relative">
                    <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleFileUpload} disabled={loading} />
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg text-[10px] font-normal uppercase tracking-widest gap-2 bg-zinc-50 hover:bg-zinc-100">
                        <Upload className="w-3 h-3" /> Upload
                    </Button>
                  </div>
                )}
             </div>
             <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {sopData.attachments?.length === 0 && <p className="text-[10px] text-zinc-400 italic text-center py-4">No technical assets attached</p>}
                {sopData.attachments?.map((file, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100 group transition-all hover:bg-white hover:border-zinc-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-100">{getFileIcon(file.fileType)}</div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-normal text-zinc-900 truncate max-w-[120px]">{file.name}</span>
                            <span className="text-[8px] text-zinc-400 uppercase">{file.fileType.split('/')[1]}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-100" onClick={() => window.open(`${import.meta.env.VITE_API_URL}${file.url}`, '_blank')}><ExternalLink className="w-3 h-3" /></Button>
                        {isEditing && <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500" onClick={() => removeAttachment(i)}><X className="w-3 h-3" /></Button>}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOPTab;
