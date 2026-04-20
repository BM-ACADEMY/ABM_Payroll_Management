import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Edit, PlusCircle, AlertCircle, CheckCircle2, UserPlus, Search, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaginationControl from '@/components/ui/PaginationControl';
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Loader from "@/components/ui/Loader";

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  
  // Manage Members State
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);
  const [saveMembersLoading, setSaveMembersLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    questions: [{ text: '', maxCredits: 0 }]
  });

  const [formLoading, setFormLoading] = useState(false);

  const fetchTeams = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams?page=${page}&limit=5`, {
        headers: { 'x-auth-token': token }
      });
      setTeams(res.data.teams);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch teams",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchTeams(page);
  };

  useEffect(() => {
    fetchTeams(1);
  }, []);

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { text: '', maxCredits: 0 }]
    });
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = field === 'maxCredits' ? parseInt(value) || 0 : value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const totalCredits = formData.questions.reduce((acc, q) => acc + q.maxCredits, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalCredits !== 100) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: `Total credits must be exactly 100. Current total: ${totalCredits}`,
      });
      return;
    }

    setFormLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (isEditing) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/teams/${currentTeamId}`, formData, {
          headers: { 'x-auth-token': token }
        });
        toast({ title: "Success", description: "Team updated successfully" });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/teams`, formData, {
          headers: { 'x-auth-token': token }
        });
        toast({ title: "Success", description: "Team created successfully" });
      }
      fetchTeams();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to save team",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const openManageMembers = async (team) => {
    setCurrentTeamId(team._id);
    setIsMembersModalOpen(true);
    setMembersLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      // Fetch all employees (using a large limit for selection dropdown)
      const empRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?limit=1000`, {
        headers: { 'x-auth-token': token }
      });
      // Handle both { employees: [...] } and [...] formats
      const employeesData = empRes.data.employees || (Array.isArray(empRes.data) ? empRes.data : []);
      setAllEmployees(employeesData);
      
      // Fetch current members
      const memRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams/${team._id}/members`, {
        headers: { 'x-auth-token': token }
      });
      setCurrentMembers(memRes.data.map(m => m._id));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch members",
      });
    } finally {
      setMembersLoading(false);
    }
  };

  const handleToggleMember = (userId) => {
    if (currentMembers.includes(userId)) {
      setCurrentMembers(currentMembers.filter(id => id !== userId));
    } else {
      setCurrentMembers([...currentMembers, userId]);
    }
  };

  const handleSaveMembers = async () => {
    setSaveMembersLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/teams/${currentTeamId}/members`, {
        userIds: currentMembers
      }, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Team members updated successfully" });
      setIsMembersModalOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update members",
      });
    } finally {
      setSaveMembersLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      questions: [{ text: '', maxCredits: 0 }]
    });
    setIsEditing(false);
    setCurrentTeamId(null);
  };

  const openEditModal = (team) => {
    setFormData({
      name: team.name,
      description: team.description || '',
      questions: team.questions.map(q => ({ text: q.text, maxCredits: q.maxCredits }))
    });
    setCurrentTeamId(team._id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = async (id) => {
    setTeamToDelete(id);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/teams/${teamToDelete}`, {
        headers: { 'x-auth-token': token }
      });
      setTeams(teams.filter(t => t._id !== teamToDelete));
      toast({ title: "Success", description: "Team deleted successfully" });
      setTeamToDelete(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete team" });
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
              Team <span className="text-[#d30614]">Management</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal max-w-xl">Architect organizational units and define dynamic performance evaluation protocols.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-zinc-800 text-[#fffe01] flex items-center justify-center gap-3 h-14 md:h-16 px-8 rounded-2xl font-bold uppercase tracking-widest shadow-xl w-full xl:w-auto transition-all hover:-translate-y-1 active:scale-95 group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Initialize New Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[750px] max-h-[92vh] overflow-y-auto bg-white p-0 rounded-3xl border-0 shadow-2xl">
            <div className="bg-zinc-900 p-6 md:p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#fffe01]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{isEditing ? 'Modify Internal Unit' : 'Configure New Unit'}</DialogTitle>
               <DialogDescription className="text-zinc-400 text-sm font-medium uppercase tracking-widest leading-relaxed">
                 Define the operational profile and high-performance metrics (Total aggregate must be 100).
               </DialogDescription>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] uppercase font-black text-zinc-400 tracking-widest ml-1">Functional Designation</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Strategic Engineering" className="h-12 md:h-14 rounded-2xl border-zinc-200 focus-visible:ring-black text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] uppercase font-black text-zinc-400 tracking-widest ml-1">Mission Statement (Optional)</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Primary objectives and scope of operations..." className="rounded-2xl border-zinc-200 min-h-[100px] focus-visible:ring-black p-4 text-base resize-none" />
                </div>
              </div>

              <div className="space-y-5 pt-8 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#d30614]" />
                    Evaluation Dimensions
                  </h3>
                  <Badge variant={totalCredits === 100 ? "success" : "destructive"} className={`px-4 py-2 rounded-xl border-2 font-black text-[11px] tracking-widest uppercase shadow-sm ${totalCredits === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    Aggregate: {totalCredits} / 100
                  </Badge>
                </div>

                <div className="space-y-4">
                  {formData.questions.map((q, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 p-5 md:p-6 bg-zinc-50 border border-zinc-100 rounded-[2rem] relative group hover:bg-zinc-100 transition-colors">
                      <div className="flex-1 space-y-2">
                        <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dimension {index + 1}</Label>
                        <Input value={q.text} onChange={(e) => handleQuestionChange(index, 'text', e.target.value)} required placeholder="Primary evaluation criteria..." className="h-12 border-none bg-white rounded-xl shadow-sm focus-visible:ring-black text-sm" />
                      </div>
                      <div className="w-full sm:w-32 space-y-2">
                        <Label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Limit (PTS)</Label>
                        <Input type="number" value={q.maxCredits} onChange={(e) => handleQuestionChange(index, 'maxCredits', e.target.value)} required min="1" max="100" className="h-12 border-none bg-white rounded-xl shadow-sm focus-visible:ring-black text-center font-bold text-lg" />
                      </div>
                      {formData.questions.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveQuestion(index)} className="absolute -right-2 -top-2 w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl border border-zinc-100 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                          <Trash2 className="w-4 h-4 md:w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={handleAddQuestion} className="w-full border-dashed border-2 py-10 md:py-12 rounded-[2rem] text-zinc-400 hover:text-black hover:border-black hover:bg-zinc-50 transition-all font-bold uppercase tracking-widest text-xs group">
                  <PlusCircle className="w-6 h-6 mb-2 group-hover:scale-125 transition-transform block mx-auto" />
                  Append Dimension
                </Button>
              </div>

              <DialogFooter className="pt-8 border-t flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-zinc-400 hover:text-black">Abort</Button>
                </DialogClose>
                <Button type="submit" disabled={formLoading} className="flex-1 h-14 bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest shadow-xl">
                  {formLoading ? 'ARCHIVING...' : (isEditing ? 'Update Configuration' : 'Authorize Deployment')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 gap-4">
             <Loader size="lg" color="red" />
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Syncing Units</span>
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-zinc-50/50 rounded-[3rem] border-2 border-dashed border-zinc-200">
            <Users className="w-16 h-16 text-zinc-200 mx-auto mb-6 opacity-50" />
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Zero units found</h3>
            <p className="text-zinc-400 mt-2 text-sm font-medium uppercase tracking-widest">Architect a team profile to begin performance tracking.</p>
          </div>
        ) : (
          <>
            {teams.map((team) => (
            <Card key={team._id} className="bg-white border-zinc-100 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden group flex flex-col hover:-translate-y-2 border-b-4 border-b-transparent hover:border-b-[#fffe01]">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center group-hover:bg-[#fffe01] transition-all duration-500 shadow-xl group-hover:rotate-6">
                    <Users className="w-7 h-7 text-white group-hover:text-black transition-colors" />
                  </div>
                  <div className="flex gap-1.5 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    <Button variant="outline" size="icon" onClick={() => openManageMembers(team)} title="Manage Deployment" className="h-10 w-10 border-zinc-100 text-zinc-400 hover:text-black hover:bg-[#fffe01] hover:border-black rounded-xl">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditModal(team)} className="h-10 w-10 border-zinc-100 text-zinc-400 hover:text-black hover:bg-[#fffe01] hover:border-black rounded-xl">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteTeam(team._id)} className="h-10 w-10 border-zinc-100 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-zinc-900 capitalize mb-1">{team.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[48px] text-zinc-500 font-medium text-sm leading-relaxed">{team.description || 'Global operational profile pending definition.'}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6 flex-1">
                <div className="pt-6 border-t border-zinc-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol Metrics</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight border-zinc-100 bg-zinc-50/50 py-1 px-3 rounded-lg">{team.questions.length} DIMENSIONS</Badge>
                  </div>
                  <div className="space-y-2">
                    {team.questions.slice(0, 3).map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-3 bg-zinc-50/50 rounded-xl group-hover:bg-zinc-50 transition-colors">
                        <span className="truncate flex-1 pr-3 font-medium text-zinc-600">{q.text}</span>
                        <Badge className="bg-black text-[#fffe01] font-black text-[9px] shrink-0 h-6 px-2">{q.maxCredits} PTS</Badge>
                      </div>
                    ))}
                    {team.questions.length > 3 && (
                      <div className="flex justify-center pt-2">
                        <div className="px-4 py-1.5 bg-zinc-50 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-100">+{team.questions.length - 3} Additional metrics</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="col-span-full flex justify-center pt-10">
            <PaginationControl pagination={pagination} onPageChange={handlePageChange} />
          </div>
        </>
        )}
      </div>

      {/* Manage Members Dialog */}
      <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[650px] max-h-[92vh] overflow-hidden flex flex-col bg-white p-0 rounded-3xl border-0 shadow-2xl">
          <div className="bg-black p-6 md:p-8 text-white">
             <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Team Deployment</DialogTitle>
             <DialogDescription className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
               Assign or revoke personnel access to this operational unit.
             </DialogDescription>
          </div>
          
          <div className="p-6 md:p-8 flex-1 overflow-hidden flex flex-col gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
              <Input 
                placeholder="Search personnel directory..." 
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="pl-11 h-14 rounded-2xl border-zinc-200 focus-visible:ring-black shadow-inner text-base"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[350px]">
              {membersLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader size="md" color="red" />
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Accessing directory</span>
                </div>
              ) : allEmployees.filter(emp => emp.name.toLowerCase().includes(memberSearchTerm.toLowerCase())).length === 0 ? (
                <div className="py-24 text-center">
                   <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No matching personnel records</p>
                </div>
              ) : (
                allEmployees
                  .filter(emp => emp.name.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                  .map(emp => (
                    <div 
                      key={emp._id} 
                      onClick={() => handleToggleMember(emp._id)}
                      className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all ${currentMembers.includes(emp._id) ? 'border-black bg-zinc-50 shadow-sm' : 'border-zinc-50 hover:border-zinc-100 bg-white'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${currentMembers.includes(emp._id) ? 'bg-black text-[#fffe01]' : 'bg-gray-50 text-zinc-300 border border-zinc-100'}`}>
                           {emp.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-gray-900">{emp.name}</span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{emp.employeeId}</span>
                        </div>
                      </div>
                      {currentMembers.includes(emp._id) ? (
                        <div className="bg-emerald-500 text-white rounded-full p-1 shadow-lg shadow-emerald-500/20">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-zinc-100 hover:border-zinc-300 transition-colors" />
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row gap-4">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-zinc-400 hover:text-black" onClick={() => setIsMembersModalOpen(false)}>Abort</Button>
            <Button 
              onClick={handleSaveMembers} 
              disabled={saveMembersLoading}
              className="flex-1 h-14 bg-black text-[#fffe01] hover:bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95"
            >
              {saveMembersLoading ? 'SYNCHRONIZING...' : 'Commit Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={confirmDeleteTeam}
        title="Delete Team"
        description="Are you sure you want to delete this team? This action will remove all team associations."
      />
    </div>
  );
};

export default TeamManagement;

