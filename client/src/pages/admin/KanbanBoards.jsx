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
import { Layout, Plus, Users, ArrowRight, Kanban, Clock, Calendar, MoreVertical, Trash2, Edit, Activity, TrendingUp, AlertTriangle, CheckCircle2, Layers, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterTeamIds, setFilterTeamIds] = useState(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const teamsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/${isAdmin ? 'admin/teams' : 'auth/my-teams'}`, {
        headers: { 'x-auth-token': token }
      });
      
      const teamsArray = Array.isArray(teamsRes.data.teams) ? teamsRes.data.teams : (Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setTeams(teamsArray);

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
    if (isAdmin && !selectedTeamId) {
      toast({ variant: "destructive", title: "Wait", description: "Please select a team first" });
      return;
    }
    try {
      const token = localStorage.getItem('token');
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
    setIsDeleting(true);
    const deletingId = boardToDelete._id;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/boards/${deletingId}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Deleted", description: "Board removed" });
      // Close dialog immediately before refetching
      setBoardToDelete(null);
      // Optimistically remove from local state so UI updates instantly
      setBoardsByTeam(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(teamId => {
          updated[teamId] = updated[teamId].filter(b => b._id !== deletingId);
        });
        return updated;
      });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete board" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditBoard = (board) => {
    setBoardToEdit(board);
    setFormData({ title: board.title, description: board.description || '' });
    setSelectedTeamId(board.team?._id || board.team);
    setIsEditModalOpen(true);
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    if (!boardToEdit) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/${boardToEdit._id}`, {
        title: formData.title,
        description: formData.description,
        team: selectedTeamId
      }, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Board updated successfully" });
      setIsEditModalOpen(false);
      setBoardToEdit(null);
      setFormData({ title: '', description: '' });
      fetchData();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update board" });
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId !== source.droppableId) return;
    if (destination.index === source.index) return;

    const teamId = source.droppableId;
    const teamBoards = [...(boardsByTeam[teamId] || [])];
    const [reorderedItem] = teamBoards.splice(source.index, 1);
    teamBoards.splice(destination.index, 0, reorderedItem);

    // Optimistically update UI
    const updatedBoards = teamBoards.map((b, index) => ({ ...b, position: index }));
    setBoardsByTeam(prev => ({ ...prev, [teamId]: updatedBoards }));

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/boards/reorder`, {
        boards: updatedBoards.map((b, i) => ({ _id: b._id, position: i }))
      }, {
        headers: { 'x-auth-token': token }
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Error", description: "Failed to save order" });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader size="lg" color="red" />
        <span className="text-xs font-normal text-gray-400 uppercase tracking-widest">Constructing Workspace...</span>
      </div>
    );
  }

  const velocity = (Object.values(boardsByTeam).flat().reduce((acc, b) => acc + (b.progress || 0), 0) / (Object.values(boardsByTeam).flat().length || 1)).toFixed(0);

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/30 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-slate-800">
            Team <span className="text-slate-400">Boards</span>
          </h1>
          <p className="text-slate-500 max-w-2xl font-normal text-sm">Synthesizing project velocity and team execution vectors.</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
             <div className="p-2 bg-slate-100 rounded-xl">
               <Activity className="w-5 h-5 text-slate-500" />
             </div>
             <div>
               <div className="text-[9px] font-normal text-slate-400 uppercase tracking-widest">Active Velocity</div>
               <div className="text-xl font-normal text-slate-900 leading-tight">
                 {velocity}%
               </div>
             </div>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-[#fffe01] hover:bg-slate-800 rounded-xl px-6 py-5 h-auto transition-all shadow-lg active:scale-95 border-b-2 border-slate-950">
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-3xl bg-white p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-normal text-slate-900">Create New Board</DialogTitle>
                <DialogDescription className="font-normal text-slate-500">Initialize a new dashboard for tasks.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBoard} className="space-y-6 pt-4">
                {(isAdmin || teams.length > 1) && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-normal text-xs uppercase tracking-widest">Select Team</Label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-slate-900 outline-none transition-all text-sm font-normal"
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
                  <Label className="text-slate-700 font-normal text-xs uppercase tracking-widest">Board Title</Label>
                  <Input 
                    placeholder="e.g. Q1 Development Goals" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="rounded-xl border-slate-200 h-12 font-normal"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-normal text-xs uppercase tracking-widest">Description</Label>
                  <Textarea 
                    placeholder="What is this board for?" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="rounded-xl border-slate-200 min-h-[100px] font-normal"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full bg-slate-900 text-[#fffe01] hover:bg-slate-800 rounded-xl h-12 text-sm tracking-widest uppercase font-normal transition-all active:scale-95 shadow-xl">
                    Create Board
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Team Filter Tabs - shown when there are multiple teams */}
      {teams.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterTeamIds(new Set())}
            className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-widest border transition-all ${
              filterTeamIds.size === 0
                ? 'bg-slate-900 text-[#fffe01] border-slate-900 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
            }`}
          >
            All Teams
          </button>
          {teams.map(team => {
            const isSelected = filterTeamIds.has(team._id);
            return (
              <button
                key={team._id}
                onClick={() => {
                  setFilterTeamIds(prev => {
                    const next = new Set(prev);
                    if (next.has(team._id)) {
                      next.delete(team._id);
                    } else {
                      next.add(team._id);
                    }
                    return next;
                  });
                }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-widest border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-[#fffe01] border-slate-900 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                }`}
              >
                <Users className="w-3 h-3" />
                {team.name}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-700 text-yellow-300' : 'bg-slate-100 text-slate-400'
                }`}>
                  {boardsByTeam[team._id]?.length || 0}
                </span>
              </button>
            );
          })}
          {filterTeamIds.size > 0 && (
            <span className="text-[9px] text-slate-400 font-normal uppercase tracking-widest ml-1">
              {filterTeamIds.size} team{filterTeamIds.size > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      )}

      <div className="space-y-16 pb-20">
        <DragDropContext onDragEnd={onDragEnd}>
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-slate-300 rounded-full"></div>
              <h2 className="text-[10px] font-normal uppercase tracking-[0.2em] text-slate-400">Team Workspaces</h2>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <Kanban className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-normal mb-1">No Teams Found</h3>
                <p className="text-slate-400 italic text-sm font-normal">Create a team in Management to proceed.</p>
              </div>
            ) : (
              teams.filter(team => filterTeamIds.size === 0 || filterTeamIds.has(team._id)).map(team => (
                <div key={team._id} className="space-y-6">
                  <div className="flex items-center gap-4 pl-1">
                    <div className="bg-slate-100 p-2.5 rounded-xl">
                      <Users className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-normal text-slate-800">{team.name}</h2>
                      <p className="text-slate-400 text-[10px] font-normal uppercase tracking-widest">{boardsByTeam[team._id]?.length || 0} ACTIVE SYSTEMS</p>
                    </div>
                  </div>

                  <Droppable droppableId={team._id} direction="horizontal">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      >
                        {boardsByTeam[team._id]?.map((board, index) => (
                          <Draggable key={board._id} draggableId={board._id} index={index}>
                            {(draggableProvided, snapshot) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                className={`relative group ${snapshot.isDragging ? 'z-[100]' : ''}`}
                              >
                                <Card 
                                  className={`h-full border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition-all cursor-pointer rounded-[2rem] bg-white overflow-hidden group/card flex flex-col hover:-translate-y-1 duration-300 ${snapshot.isDragging ? 'shadow-2xl border-slate-900 bg-slate-50' : ''}`}
                                  onClick={() => navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban/${board._id}`)}
                                >
                                  <CardHeader className="pb-4 pt-6 px-6">
                                    <div className="flex items-center justify-between mb-4">
                                       <div className="flex items-center gap-2">
                                          <div {...draggableProvided.dragHandleProps} className="p-1 text-slate-300 hover:text-slate-900 cursor-grab active:cursor-grabbing transition-colors">
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                          <Badge variant="outline" className={`text-[8px] font-normal tracking-widest border-slate-100 uppercase py-0 ${board.status === 'Active' ? 'text-blue-500 bg-blue-50' : 'text-slate-400 bg-slate-50'}`}>
                                            {board.status || 'Active'}
                                          </Badge>
                                       </div>
                                       {board.stats?.blocked > 0 && (
                                         <Badge className="bg-red-50 text-red-500 hover:bg-red-100 border-none text-[8px] font-normal flex items-center gap-1 py-0">
                                           <AlertTriangle className="w-3 h-3" /> {board.stats.blocked} BLOCKED
                                         </Badge>
                                       )}
                                    </div>
                                    <CardTitle className="text-xl font-normal text-slate-800 group-hover/card:text-slate-950 transition-colors tracking-tight line-clamp-1">{board.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[36px] font-normal text-slate-400 text-xs mt-1.5 leading-relaxed">{board.description || 'No description provided for this operational workspace.'}</CardDescription>
                                  </CardHeader>
                                  
                                  <CardContent className="px-6 pb-6 space-y-5 flex-1 flex flex-col justify-end">
                                    <div className="space-y-2.5">
                                      <div className="flex items-center justify-between text-[9px] font-normal uppercase tracking-widest text-slate-400">
                                          <span>Throughput</span>
                                          <span className="text-slate-900">{board.progress || 0}%</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                                         <div 
                                           className={`h-full rounded-full transition-all duration-700 ${board.progress === 100 ? "bg-emerald-500" : "bg-slate-900"}`} 
                                           style={{ width: `${board.progress || 0}%` }} 
                                         />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                       <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100/50">
                                         <div className="text-[8px] font-normal text-slate-400 uppercase tracking-tight mb-0.5">Total</div>
                                         <div className="text-xs font-normal text-slate-700">{board.stats?.total || 0}</div>
                                       </div>
                                       <div className="bg-emerald-50/50 p-2.5 rounded-xl text-center border border-emerald-100/50">
                                         <div className="text-[8px] font-normal text-emerald-600/60 uppercase tracking-tight mb-0.5">Done</div>
                                         <div className="text-xs font-normal text-emerald-600">{board.stats?.completed || 0}</div>
                                       </div>
                                       <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100/50">
                                         <div className="text-[8px] font-normal text-slate-400 uppercase tracking-tight mb-0.5">API</div>
                                         <div className="text-xs font-normal text-slate-700"><Layers className="w-2.5 h-2.5 mx-auto opacity-30" /></div>
                                       </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                      <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-normal uppercase tracking-tight">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(board.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                      </div>
                                      <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/card:bg-slate-900 group-hover/card:text-[#fffe01] text-slate-300 transition-all border border-slate-100 group-hover/card:border-slate-900 group-hover/card:scale-110 active:scale-95">
                                        <ArrowRight className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                {isAdmin && (
                                  <div className={`absolute top-3 right-3 transition-opacity flex gap-2 ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 rounded-lg bg-white/90 shadow-sm hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditBoard(board);
                                      }}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 rounded-lg bg-white/90 shadow-sm hover:bg-red-50 hover:text-red-500 border border-slate-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBoardToDelete(board);
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        <button 
                          onClick={() => { setSelectedTeamId(team._id); setIsModalOpen(true); }}
                          className="flex flex-col items-center justify-center gap-3 border border-dashed border-slate-200 rounded-[2rem] p-8 hover:border-slate-900 hover:bg-white transition-all group min-h-[220px] shadow-sm bg-slate-50/20"
                        >
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-[#fffe01] transition-all shadow-sm">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] uppercase tracking-widest font-normal text-slate-400 group-hover:text-slate-900 transition-colors">Initialize Local Board</span>
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              ))
            )}
          </section>
        </DragDropContext>
        
        {/* Shared Workspaces - External cross-team boards (Hidden for Admins as they see all team boards natively) */}
        {!isAdmin && sharedBoards.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-blue-300 rounded-full"></div>
              <h2 className="text-[10px] font-normal uppercase tracking-[0.2em] text-slate-400">Collaboration Space</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sharedBoards.map(board => (
                <div key={board._id} className="relative group">
                  <Card 
                    className="h-full border border-slate-200/60 shadow-sm hover:shadow-xl transition-all cursor-pointer rounded-[2rem] bg-white overflow-hidden group/card flex flex-col hover:-translate-y-1 duration-300"
                    onClick={() => navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban/${board._id}`)}
                  >
                    <CardHeader className="pb-4 pt-6 px-6">
                      <div className="flex items-center justify-between mb-4">
                         <Badge variant="outline" className="text-[8px] font-normal tracking-widest text-blue-500 border-blue-100 bg-blue-50/50 py-0 uppercase">
                           {board.team?.name || 'Shared'}
                         </Badge>
                      </div>
                      <CardTitle className="text-xl font-normal text-slate-800 group-hover/card:text-blue-600 transition-colors tracking-tight line-clamp-1">{board.title}</CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[36px] font-normal text-slate-400 text-xs mt-1.5 leading-relaxed">{board.description || 'Collaborative workspace for cross-team operations.'}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-6 pb-6 space-y-5 flex-1 flex flex-col justify-end">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[9px] font-normal uppercase tracking-widest text-slate-400">
                           <span>Progress</span>
                           <span className="text-slate-900">{board.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                           <div 
                             className={`h-full rounded-full transition-all duration-700 ${board.progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`} 
                             style={{ width: `${board.progress || 0}%` }} 
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                         <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100/50 text-[11px]">
                           <div className="text-[8px] font-normal text-slate-400 uppercase tracking-tight mb-0.5">Tasks</div>
                           <div className="font-normal text-slate-700">{board.stats?.total || 0}</div>
                         </div>
                         <div className="bg-blue-50/50 p-2.5 rounded-xl text-center border border-blue-100/50 text-[11px]">
                           <div className="text-[8px] font-normal text-blue-600/50 uppercase tracking-tight mb-0.5">Done</div>
                           <div className="font-normal text-blue-600">{board.stats?.completed || 0}</div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-normal uppercase tracking-tight">
                          <Users className="w-3 h-3" />
                          <span>COLLABORATOR</span>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/card:bg-blue-500 group-hover/card:text-white text-zinc-300 transition-all border border-slate-100 group-hover/card:border-blue-500 group-hover/card:scale-110 shadow-sm active:scale-95">
                          <ArrowRight className="w-4 h-4" />
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
        isLoading={isDeleting}
        title="Delete Board"
        description={`Are you sure you want to delete "${boardToDelete?.title}"? All tasks and lists will be permanently removed.`}
      />

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-3xl bg-white p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-normal text-slate-900">Edit Board</DialogTitle>
            <DialogDescription className="font-normal text-slate-500">Update board configuration.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBoard} className="space-y-6 pt-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-normal text-xs uppercase tracking-widest">Select Team</Label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-slate-900 outline-none transition-all text-sm font-normal"
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
              <Label className="text-slate-700 font-normal text-xs uppercase tracking-widest">Board Title</Label>
              <Input 
                placeholder="e.g. Q1 Development Goals" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="rounded-xl border-slate-200 h-12 font-normal"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-normal text-xs uppercase tracking-widest">Description</Label>
              <Textarea 
                placeholder="What is this board for?" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="rounded-xl border-slate-200 min-h-[100px] font-normal"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-slate-900 text-[#fffe01] hover:bg-slate-800 rounded-xl h-12 text-sm tracking-widest uppercase font-normal transition-all active:scale-95 shadow-xl">
                Update Board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanBoards;
