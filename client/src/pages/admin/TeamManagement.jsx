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

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  
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

  const fetchTeams = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams`, {
        headers: { 'x-auth-token': token }
      });
      setTeams(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch teams",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
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
      // Fetch all employees
      const empRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees`, {
        headers: { 'x-auth-token': token }
      });
      setAllEmployees(empRes.data);
      
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
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/teams/${id}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Success", description: "Team deleted successfully" });
      fetchTeams();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete team",
      });
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Team <span className="text-[#d30614]">Management</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal">Define teams and their dynamic performance evaluation criteria</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-zinc-800 text-[#fffe01] flex items-center justify-center gap-2 py-7 px-8 rounded-2xl font-medium shadow-lg w-full md:w-auto transition-all">
              <Plus className="w-5 h-5" />
              Create New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Team' : 'Create New Team'}</DialogTitle>
              <DialogDescription>
                Define the team profile and the questions used for weekly scoring (total credits must be 100).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Creative Developers" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What does this team do?" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Evaluation Questions</h3>
                  <Badge variant={totalCredits === 100 ? "success" : "destructive"} className={`px-3 py-1 ${totalCredits === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    Total Credits: {totalCredits} / 100
                  </Badge>
                </div>

                {formData.questions.map((q, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl relative group">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-gray-500">Question {index + 1}</Label>
                      <Input value={q.text} onChange={(e) => handleQuestionChange(index, 'text', e.target.value)} required placeholder="e.g. Quality of code delivered this week" />
                    </div>
                    <div className="w-full sm:w-32 space-y-2">
                      <Label className="text-xs text-gray-500">Max Credits</Label>
                      <Input type="number" value={q.maxCredits} onChange={(e) => handleQuestionChange(index, 'maxCredits', e.target.value)} required min="1" max="100" />
                    </div>
                    {formData.questions.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveQuestion(index)} className="absolute -right-2 -top-2 bg-white shadow-sm border rounded-full text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={handleAddQuestion} className="w-full border-dashed border-2 py-8 rounded-xl text-gray-400 hover:text-black hover:border-black transition-all">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Another Question
                </Button>
              </div>

              <DialogFooter className="pt-6 border-t">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={formLoading} className="bg-black text-[#fffe01] hover:bg-zinc-800">
                  {formLoading ? 'Saving...' : (isEditing ? 'Update Team' : 'Create Team')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No teams defined yet</h3>
            <p className="text-gray-500 mt-2">Create your first team to start evaluating performance</p>
          </div>
        ) : (
          teams.map((team) => (
            <Card key={team._id} className="bg-white border-zinc-200 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-[#fffe01]/10 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-[#fffe01] transition-colors">
                    <Users className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openManageMembers(team)} title="Manage Members" className="h-8 w-8 text-zinc-400 hover:text-black">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(team)} className="h-8 w-8 text-zinc-400 hover:text-black">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team._id)} className="h-8 w-8 text-zinc-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-medium tracking-tight text-black capitalize">{team.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px] text-zinc-500 font-normal">{team.description || 'No description provided'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-4 border-t border-zinc-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Evaluation Criteria</span>
                    <Badge variant="outline" className="text-[10px] font-normal border-zinc-200">{team.questions.length} Questions</Badge>
                  </div>
                  <div className="space-y-2">
                    {team.questions.slice(0, 3).map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 bg-zinc-50 rounded-lg">
                        <span className="truncate flex-1 pr-2 text-zinc-600">{q.text}</span>
                        <span className="text-black font-medium shrink-0">{q.maxCredits} pts</span>
                      </div>
                    ))}
                    {team.questions.length > 3 && (
                      <p className="text-center text-xs text-zinc-400 pt-1">+{team.questions.length - 3} more questions</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Manage Members Dialog */}
      <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col bg-white p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Manage Team Members</DialogTitle>
            <DialogDescription>
              Select employees to assign to this team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search employees..." 
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 min-h-[300px]">
            {membersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
              </div>
            ) : allEmployees.filter(emp => emp.name.toLowerCase().includes(memberSearchTerm.toLowerCase())).length === 0 ? (
              <p className="text-center py-12 text-gray-500">No employees found</p>
            ) : (
              allEmployees
                .filter(emp => emp.name.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                .map(emp => (
                  <div 
                    key={emp._id} 
                    onClick={() => handleToggleMember(emp._id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${currentMembers.includes(emp._id) ? 'border-black bg-zinc-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-900">{emp.name}</span>
                      <span className="text-xs text-gray-500">{emp.employeeId}</span>
                    </div>
                    {currentMembers.includes(emp._id) ? (
                      <div className="bg-black text-[#fffe01] rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-200" />
                    )}
                  </div>
                ))
            )}
          </div>

          <DialogFooter className="p-6 bg-gray-50 border-t">
            <Button variant="outline" onClick={() => setIsMembersModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveMembers} 
              disabled={saveMembersLoading}
              className="bg-black text-[#fffe01] hover:bg-zinc-800"
            >
              {saveMembersLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
