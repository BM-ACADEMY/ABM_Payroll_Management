import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Layout, Plus, Users, ArrowRight, Kanban, Clock, Calendar, MoreVertical, Trash2, Edit, Activity, TrendingUp, AlertTriangle, CheckCircle2, Layers } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Loader from "@/components/ui/Loader";

const KanbanBoards = () => {
  const [teams, setTeams] = useState([]);
  const [boardsByTeam, setBoardsByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharedBoards, setSharedBoards] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [boardToDelete, setBoardToDelete] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const userRole = sessionStorage.getItem('userRole');
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const teamsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/${isAdmin ? 'admin/teams' : 'auth/my-teams'}`, {
        headers: { 'x-auth-token': token }
      });
      
      const teamsArray = Array.isArray(teamsRes.data.teams) ? teamsRes.data.teams : (Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setTeams(teamsArray);

      // Auto-select first team for non-admins to avoid validation issues
      if (!isAdmin && teamsArray.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsArray[0]._id);
      }
      
      const boardsPromises = teamsArray.map(team => 
        axios.get(`${import.meta.env.VITE_API_URL}/api/boards/team/${team._id}`, {
          headers: { 'x-auth-token': token }
        })
      );
      const boardsResponses = await Promise.all(boardsPromises);
      
      const boardsMap = {};
      teamsArray.forEach((team, index) => {
        boardsMap[team._id] = boardsResponses[index].data;
      });
      setBoardsByTeam(boardsMap);
      const sharedRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/boards/shared`, {
        headers: { 'x-auth-token': token }
      });
      setSharedBoards(sharedRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    // Only enforce selectedTeamId for admins who have the selection dropdown
    if (isAdmin && !selectedTeamId) {
      toast({ variant: "destructive", title: "Wait", description: "Please select a team first" });
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/boards`, {
        ...formData,
        teamId: selectedTeamId
      }, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Board created successfully" });
      setIsModalOpen(false);
      setFormData({ title: '', description: '' });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create board" });
    }
  };

  const confirmDeleteBoard = async () => {
    if (!boardToDelete) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/${boardToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Deleted", description: "Board removed" });
      setBoardToDelete(null);
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete board" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader size="lg" color="red" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Constructing Workspace...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Team <span className="text-[#d30614]">Boards</span>
            </h1>
          </div>
          <p className="text-gray-500 max-w-2xl font-normal">Synthesizing project velocity, task throughput, and team execution vectors.</p>
        </div>

        <div className="flex gap-4">
          <Card className="hidden md:flex flex-row items-center gap-4 bg-zinc-900 text-white p-4 rounded-3xl border-none shadow-xl">
             <div className="p-2 bg-[#fffe01] rounded-xl">
               <Activity className="w-5 h-5 text-black" />
             </div>
             <div>
               <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Velocity</div>
               <div className="text-lg font-black text-[#fffe01]">
                 {Object.values(boardsByTeam).flat().reduce((acc, b) => acc + (b.progress || 0), 0) / (Object.values(boardsByTeam).flat().length || 1).toFixed(0)}%
               </div>
             </div>
          </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl px-8 py-6 h-auto transition-all shadow-xl hover:shadow-zinc-200">
              <Plus className="w-5 h-5 mr-2" />
              New Project Board
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Create New Board</DialogTitle>
              <DialogDescription className="font-normal text-zinc-500">Add a new dashboard for your team to start tracking tasks.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBoard} className="space-y-6 pt-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label className="text-zinc-700 font-medium">Select Team</Label>
                  <select 
                    className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                  >
                    <option value="">Select a team...</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}
                <div className="space-y-2">
                  <Label className="text-zinc-700 font-medium">Board Title</Label>
                  <Input 
                    placeholder="e.g. Q1 Development Goals" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="rounded-xl border-zinc-200 py-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700 font-medium">Description</Label>
                  <Textarea 
                    placeholder="What is this board for?" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="rounded-xl border-zinc-200 min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full bg-black text-[#fffe01] hover:bg-zinc-800 rounded-xl py-6 h-auto text-lg font-medium transition-transform active:scale-95">
                    Create Board
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
      </div>
    </header>

      <div className="space-y-16 pb-20">
        {/* Regular workspaces */}
        <section className="space-y-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 w-1 bg-zinc-300 rounded-full"></div>
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400">Team Workspaces</h2>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-[40px] border border-zinc-100">
              <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-300">
                <Kanban className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
              <p className="text-zinc-500 italic font-normal">Please create a team first in Team Management.</p>
            </div>
          ) : (
            teams.map(team => (
              <div key={team._id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-100 p-3 rounded-2xl">
                    <Users className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-medium text-zinc-900">{team.name}</h2>
                    <p className="text-zinc-500 text-sm font-normal">{boardsByTeam[team._id]?.length || 0} active boards</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {boardsByTeam[team._id]?.map(board => (
                    <div key={board._id} className="relative group">
                      <Card 
                        className="h-full border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer rounded-[2.5rem] bg-white overflow-hidden group/card flex flex-col"
                        onClick={() => navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban/${board._id}`)}
                      >
                        <div className={`h-1.5 w-full ${board.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#fffe01] to-[#d30614]'}`}></div>
                        <CardHeader className="pb-4 pt-8 px-8">
                          <div className="flex items-center justify-between mb-4">
                             <Badge variant="outline" className={`text-[8px] font-black tracking-widest border-zinc-100 ${board.status === 'Active' ? 'text-blue-500 bg-blue-50' : 'text-zinc-400 bg-zinc-50'}`}>
                               {board.status || 'ACTIVE'}
                             </Badge>
                             {board.stats?.blocked > 0 && (
                               <Badge className="bg-red-50 text-red-500 hover:bg-red-100 border-none text-[8px] font-black flex items-center gap-1">
                                 <AlertTriangle className="w-3 h-3" /> {board.stats.blocked} BLOCKED
                               </Badge>
                             )}
                          </div>
                          <CardTitle className="text-2xl font-black text-zinc-900 group-hover/card:text-[#d30614] transition-colors tracking-tight line-clamp-1">{board.title}</CardTitle>
                          <CardDescription className="line-clamp-2 min-h-[40px] font-medium text-zinc-400 text-sm mt-1 leading-relaxed">{board.description || 'No description provided for this operational workspace.'}</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="px-8 pb-8 space-y-6 flex-1 flex flex-col justify-end">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                               <span>Throughput</span>
                               <span className="text-zinc-900">{board.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-500 ${board.progress === 100 ? "bg-emerald-500" : "bg-black"}`} 
                                 style={{ width: `${board.progress || 0}%` }} 
                               />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                             <div className="bg-zinc-50 p-3 rounded-2xl text-center">
                               <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Total</div>
                               <div className="text-sm font-black text-zinc-900">{board.stats?.total || 0}</div>
                             </div>
                             <div className="bg-emerald-50 p-3 rounded-2xl text-center">
                               <div className="text-[10px] font-black text-emerald-600/50 uppercase tracking-tighter">Done</div>
                               <div className="text-sm font-black text-emerald-600">{board.stats?.completed || 0}</div>
                             </div>
                             <div className="bg-zinc-50 p-3 rounded-2xl text-center">
                               <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">API</div>
                               <div className="text-sm font-black text-zinc-900"><Layers className="w-3 h-3 mx-auto opacity-20" /></div>
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-tight">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(board.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover/card:bg-[#fffe01] group-hover/card:text-black text-zinc-300 transition-all border border-zinc-100 group-hover/card:border-transparent group-hover/card:scale-110 shadow-sm active:scale-95">
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:bg-red-50 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBoardToDelete(board);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => { setSelectedTeamId(team._id); setIsModalOpen(true); }}
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-100 rounded-[32px] p-8 hover:border-[#fffe01] hover:bg-[#fffe01]/5 transition-all group min-h-[180px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-[#fffe01] text-zinc-400 group-hover:text-black transition-all">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-zinc-500 group-hover:text-black transition-colors">Create Board</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
        
        {/* Shared Workspaces */}
        {sharedBoards.length > 0 && (
          <section className="space-y-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-1 bg-[#fffe01] rounded-full"></div>
              <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400">Collaboration Space</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sharedBoards.map(board => (
                <div key={board._id} className="relative group">
                  <Card 
                    className="h-full border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer rounded-[2.5rem] bg-white overflow-hidden group/card flex flex-col"
                    onClick={() => navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban/${board._id}`)}
                  >
                    <div className={`h-1.5 w-full ${board.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}></div>
                    <CardHeader className="pb-4 pt-8 px-8">
                      <div className="flex items-center justify-between mb-4">
                         <Badge variant="outline" className="text-[8px] font-black tracking-widest text-blue-500 border-blue-100 bg-blue-50/50">
                           {board.team?.name || 'SHARED'}
                         </Badge>
                      </div>
                      <CardTitle className="text-2xl font-black text-zinc-900 group-hover/card:text-blue-500 transition-colors tracking-tight line-clamp-1">{board.title}</CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[40px] font-medium text-zinc-400 text-sm mt-1 leading-relaxed">{board.description || 'Collaborative workspace for cross-team operations.'}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-8 pb-8 space-y-6 flex-1 flex flex-col justify-end">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                           <span>Progress</span>
                           <span className="text-zinc-900">{board.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-500 ${board.progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`} 
                             style={{ width: `${board.progress || 0}%` }} 
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                         <div className="bg-zinc-50 p-3 rounded-2xl text-center">
                           <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Tasks</div>
                           <div className="text-sm font-black text-zinc-900">{board.stats?.total || 0}</div>
                         </div>
                         <div className="bg-blue-50 p-3 rounded-2xl text-center">
                           <div className="text-[10px] font-black text-blue-600/50 uppercase tracking-tighter">Done</div>
                           <div className="text-sm font-black text-blue-600">{board.stats?.completed || 0}</div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-tight">
                          <Users className="w-3.5 h-3.5" />
                          <span>COLLABORATOR</span>
                        </div>
                        <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover/card:bg-blue-500 group-hover/card:text-white text-zinc-300 transition-all border border-zinc-100 group-hover/card:border-transparent group-hover/card:scale-110 shadow-sm active:scale-95">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog 
        isOpen={!!boardToDelete}
        onClose={() => setBoardToDelete(null)}
        onConfirm={confirmDeleteBoard}
        title="Delete Board"
        description={`Are you sure you want to delete "${boardToDelete?.title}"? All tasks and lists will be permanently removed.`}
      />
    </div>
  );
};

export default KanbanBoards;

