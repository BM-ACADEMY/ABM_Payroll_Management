import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Layout, Plus, Users, ArrowRight, Kanban, Clock, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const KanbanBoards = () => {
  const [teams, setTeams] = useState([]);
  const [boardsByTeam, setBoardsByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '' });
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const userRole = sessionStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const teamsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/${isAdmin ? 'admin/teams' : 'auth/my-teams'}`, {
        headers: { 'x-auth-token': token }
      });
      setTeams(teamsRes.data);

      const boardsPromises = teamsRes.data.map(team => 
        axios.get(`${import.meta.env.VITE_API_URL}/api/boards/team/${team._id}`, {
          headers: { 'x-auth-token': token }
        })
      );
      const boardsResponses = await Promise.all(boardsPromises);
      
      const boardsMap = {};
      teamsRes.data.forEach((team, index) => {
        boardsMap[team._id] = boardsResponses[index].data;
      });
      setBoardsByTeam(boardsMap);
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
    if (!selectedTeamId) {
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

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Team <span className="text-[#d30614]">Workspaces</span>
            </h1>
          </div>
          <p className="text-gray-500 max-w-2xl font-normal">Manage team dashboards, track tasks, and collaborate across multiple projects.</p>
        </div>

        {isAdmin && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl px-8 py-6 h-auto transition-all shadow-xl hover:shadow-zinc-200">
                <Plus className="w-5 h-5 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl bg-white p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">Create New Board</DialogTitle>
                <DialogDescription className="font-normal text-zinc-500">Add a new dashboard for your team to start tracking tasks.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBoard} className="space-y-6 pt-4">
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
        )}
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-zinc-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#fffe01] rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-12 pb-20">
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
                    <Card 
                      key={board._id} 
                      className="group border-none shadow-sm hover:shadow-xl transition-all cursor-pointer rounded-3xl bg-white overflow-hidden"
                      onClick={() => navigate(`${isAdmin ? '/admin' : '/dashboard'}/kanban/${board._id}`)}
                    >
                      <div className="h-2 bg-gradient-to-r from-[#fffe01] to-[#d30614]"></div>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-semibold group-hover:text-[#d30614] transition-colors">{board.title}</CardTitle>
                        <CardDescription className="line-clamp-2 min-h-[40px] font-normal text-zinc-500">{board.description || 'No description'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-normal">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Created {new Date(board.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-zinc-50 p-2 rounded-full group-hover:bg-[#fffe01]/10 group-hover:text-black transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {isAdmin && (
                    <button 
                      onClick={() => { setSelectedTeamId(team._id); setIsModalOpen(true); }}
                      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-100 rounded-[32px] p-8 hover:border-[#fffe01] hover:bg-[#fffe01]/5 transition-all group min-h-[180px]"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-[#fffe01] text-zinc-400 group-hover:text-black transition-all">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-zinc-500 group-hover:text-black transition-colors">Create Board</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanBoards;
