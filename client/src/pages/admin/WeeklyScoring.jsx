import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfWeek, addDays } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trophy, Calendar, CheckCircle2, User, HelpCircle, History, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaginationControl from '@/components/ui/PaginationControl';

const WeeklyScoring = () => {
  const [employees, setEmployees] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [weekStart, setWeekStart] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [recentScores, setRecentScores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [scoreSearchTerm, setScoreSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?limit=1000`, {
        headers: { 'x-auth-token': token }
      });
      setEmployees(res.data.employees || res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch employees" });
      setLoading(false);
    }
  };

  const fetchRecentScores = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/scores/all?weekStartDate=${weekStart}&page=${page}&limit=10&name=${scoreSearchTerm}&team=${teamFilter}`, {
        headers: { 'x-auth-token': token }
      });
      setRecentScores(res.data.scores);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePageChange = (page) => {
    fetchRecentScores(page);
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams`, {
        headers: { 'x-auth-token': token }
      });
      setAllTeams(res.data.teams);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchEmployees(), fetchRecentScores(1), fetchTeams()]);
    };
    init();
  }, [weekStart]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecentScores(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [scoreSearchTerm, teamFilter]);

  const handleEmployeeChange = (empId) => {
    const emp = employees.find(e => e._id === empId);
    setSelectedEmployee(emp);
    setSelectedTeam(null);
    setAnswers([]);
  };

  const handleTeamChange = (teamId) => {
    const team = selectedEmployee.teams.find(t => t._id === teamId);
    setSelectedTeam(team);
    setAnswers(team.questions.map(q => ({
      questionId: q._id,
      questionText: q.text,
      creditsReceived: 0,
      maxCredits: q.maxCredits
    })));
  };

  const handleScoreChange = (index, val) => {
    const newAnswers = [...answers];
    const max = newAnswers[index].maxCredits;
    let score = parseInt(val) || 0;
    if (score > max) score = max;
    if (score < 0) score = 0;
    newAnswers[index].creditsReceived = score;
    setAnswers(newAnswers);
  };

  const totalScore = answers.reduce((acc, a) => acc + a.creditsReceived, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedTeam) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/scores`, {
        userId: selectedEmployee._id,
        teamId: selectedTeam._id,
        weekStartDate: weekStart,
        answers,
        feedback
      }, {
        headers: { 'x-auth-token': token }
      });

      toast({ title: "Success", description: "Score submitted successfully" });
      fetchRecentScores();
      // Reset form partially
      setSelectedEmployee(null);
      setSelectedTeam(null);
      setAnswers([]);
      setFeedback('');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to submit score",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditScore = (score) => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Set selected employee
    const emp = employees.find(e => e._id === (score.user?._id || score.user));
    if (emp) {
      setSelectedEmployee(emp);
      // Set selected team (need to find it in employee's populated teams)
      const team = emp.teams?.find(t => t._id === (score.team?._id || score.team));
      if (team) {
        setSelectedTeam(team);
        // Load answers and feedback
        setAnswers(score.answers.map(ans => ({
          questionId: ans.questionId,
          text: ans.text,
          maxCredits: ans.maxCredits,
          creditsReceived: ans.creditsReceived
        })));
        setFeedback(score.feedback || '');
        
        toast({ title: "Edit Mode", description: "Evaluation data loaded into the form" });
      }
    }
  };

  const handleDeleteScore = (id) => {
    setIdToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/scores/${idToDelete}`, {
        headers: { 'x-auth-token': token }
      });
      toast({ title: "Deleted", description: "Evaluation removed successfully" });
      fetchRecentScores();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete evaluation"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setIdToDelete(null);
    }
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90) return { title: "Excellent", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    if (score >= 80) return { title: "Good", color: "bg-blue-50 text-blue-600 border-blue-200" };
    if (score >= 70) return { title: "Acceptable", color: "bg-amber-50 text-amber-600 border-amber-200" };
    if (score >= 60) return { title: "Below Expectation", color: "bg-orange-50 text-orange-600 border-orange-200" };
    return { title: "Poor", color: "bg-rose-50 text-rose-600 border-rose-200" };
  };

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
              Weekly <span className="text-[#d30614]">Scoring</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal max-w-xl">Evaluate employee performance and assign weekly credits based on established criteria.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm w-full sm:w-fit">
          <Calendar className="w-5 h-5 text-zinc-400 ml-2" />
          <div className="flex flex-col pr-4">
            <span className="text-[9px] md:text-[10px] uppercase text-zinc-400 font-medium tracking-widest">Select Week (Mon)</span>
            <Input 
              type="date" 
              value={weekStart} 
              onChange={(e) => setWeekStart(e.target.value)} 
              className="border-none p-0 h-8 md:h-auto focus-visible:ring-0 text-sm md:text-base font-medium bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-5 space-y-6 md:space-y-10">
          <Card className="rounded-3xl border-zinc-200 shadow-sm bg-white relative z-50 overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Employee
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Target Individual</Label>
                <div className="relative">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <Input 
                      placeholder="Search name or ID..." 
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        if (!isMembersModalOpen) setIsMembersModalOpen(true);
                      }}
                      onFocus={() => setIsMembersModalOpen(true)}
                      className="pl-11 h-14 rounded-2xl border-zinc-200 focus-visible:ring-black placeholder:text-zinc-400"
                    />
                  </div>

                  {isMembersModalOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[999] bg-transparent" 
                        onClick={() => setIsMembersModalOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-zinc-200 rounded-3xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {(Array.isArray(employees) ? employees : []).filter(emp => 
                            (emp.name || "").toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
                            (emp.employeeId || "").toLowerCase().includes(memberSearchTerm.toLowerCase())
                          ).length === 0 ? (
                            <div className="p-12 text-center text-zinc-400">
                              <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                              <p className="text-xs uppercase tracking-widest font-medium">No records matching query</p>
                            </div>
                          ) : (
                            (Array.isArray(employees) ? employees : [])
                              .filter(emp => 
                                (emp.name || "").toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
                                (emp.employeeId || "").toLowerCase().includes(memberSearchTerm.toLowerCase())
                              )
                              .map(emp => (
                                <div 
                                  key={emp._id}
                                  onClick={() => {
                                    handleEmployeeChange(emp._id);
                                    setMemberSearchTerm(`${emp.name} (${emp.employeeId})`);
                                    setIsMembersModalOpen(false);
                                  }}
                                  className={`p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 ${selectedEmployee?._id === emp._id ? 'bg-zinc-50' : ''}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-base text-black">{emp.name}</span>
                                    <span className="text-[10px] uppercase text-zinc-400 font-medium tracking-widest">{emp.employeeId}</span>
                                  </div>
                                  {selectedEmployee?._id === emp._id && (
                                     <div className="bg-black text-[#fffe01] p-1.5 rounded-full">
                                       <CheckCircle2 className="w-4 h-4" />
                                     </div>
                                  )}
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedEmployee && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Functional Unit</Label>
                    <Badge variant="outline" className="bg-zinc-50 font-normal text-[9px] tracking-tight">{selectedEmployee.teams?.length || 0} DEPLOYMENTS</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedEmployee.teams?.map(team => (
                      <div 
                        key={team._id}
                        onClick={() => handleTeamChange(team._id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group min-h-[64px] ${selectedTeam?._id === team._id ? 'border-black bg-zinc-50 shadow-sm' : 'border-zinc-100 hover:border-zinc-200 bg-white'}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-base text-black">{team.name}</span>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">{team.questions?.length || 0} DIMENSIONS</span>
                        </div>
                        {selectedTeam?._id === team._id ? (
                           <div className="bg-black text-[#fffe01] rounded-full p-1.5 shadow-sm">
                             <CheckCircle2 className="w-4 h-4" />
                           </div>
                        ) : (
                           <div className="w-6 h-6 rounded-full border-2 border-zinc-100 group-hover:border-zinc-300 transition-colors" />
                        )}
                      </div>
                    ))}
                  </div>
                  {(!selectedEmployee.teams || selectedEmployee.teams.length === 0) && (
                    <div className="p-8 rounded-3xl border-2 border-dashed border-rose-100 bg-rose-50/20 text-center space-y-3">
                       <HelpCircle className="w-10 h-10 text-rose-300 mx-auto" />
                       <div className="space-y-1">
                         <p className="text-sm text-rose-500 font-medium uppercase tracking-tight">No units assigned</p>
                         <p className="text-[10px] text-rose-400 leading-relaxed uppercase tracking-tighter">Please configure team deployments in the central directory first.</p>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTeam && (
            <Card className="rounded-3xl border-zinc-200 shadow-sm overflow-hidden bg-white animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-black text-[#fffe01] p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl tracking-tight">Evaluate: {selectedTeam.name}</CardTitle>
                    <CardDescription className="text-zinc-400 text-[10px] uppercase tracking-widest font-medium">Session of {format(new Date(weekStart), 'MMMM dd, yyyy')}</CardDescription>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto p-4 bg-zinc-900 rounded-2xl sm:bg-transparent sm:p-0">
                    <p className="text-[10px] uppercase text-zinc-400 font-bold tracking-[0.2em] mb-1">AGGREGATE SCORE</p>
                    <p className="text-3xl font-bold">{totalScore}<span className="text-sm font-normal text-zinc-500"> / 100</span></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSubmit}>
                  <div className="p-6 md:p-8 space-y-6">
                    {answers.map((ans, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50/50 p-5 rounded-2xl border border-zinc-100 group hover:bg-white hover:border-zinc-200 transition-all">
                          <Label className="text-sm md:text-base font-medium text-gray-700 flex-1 leading-snug">{ans.questionText}</Label>
                          <div className="flex items-center gap-3 shrink-0">
                            <Input 
                              type="number"
                              min="0"
                              max={ans.maxCredits}
                              value={ans.creditsReceived}
                              onChange={(e) => handleScoreChange(idx, e.target.value)}
                              className="w-20 md:w-24 h-12 md:h-14 text-center font-bold text-xl rounded-2xl border-zinc-200 focus-visible:ring-black shadow-inner"
                            />
                            <div className="flex flex-col -space-y-0.5 border-l border-zinc-200 pl-3">
                              <span className="text-[9px] uppercase text-zinc-400 font-bold tracking-widest">LIMIT</span>
                              <span className="text-base font-black text-gray-900">{ans.maxCredits}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="space-y-3 pt-6 border-t border-zinc-100">
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold ml-1">Observational Feedback</Label>
                        <Textarea 
                          placeholder="Points of excellence or potential growth areas..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="rounded-2xl border-zinc-200 min-h-[100px] md:min-h-[120px] focus-visible:ring-black resize-none p-4 text-base"
                        />
                      </div>
                  </div>
                  <div className="p-6 md:p-8 bg-zinc-50 border-t border-zinc-100">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-[#d30614] hover:bg-black text-white h-16 rounded-2xl text-lg font-bold shadow-lg shadow-red-600/10 transition-all hover:-translate-y-1 active:scale-95">
                      {isSubmitting ? 'PROCESSING...' : 'FINALIZE EVALUATION'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-7 space-y-6 md:space-y-10">
          <Card className="rounded-3xl border-zinc-200 shadow-sm bg-white min-h-[400px] flex flex-col">
            <CardHeader className="border-b border-zinc-100 p-6 md:p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <History className="w-6 h-6 text-[#d30614]" />
                  Activity History
                </CardTitle>
                <CardDescription className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest">Logs for {format(new Date(weekStart), 'MMM dd')} - {format(addDays(new Date(weekStart), 6), 'MMM dd')}</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                <div className="relative flex-1 sm:w-48 xl:w-56">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    placeholder="Search by name..." 
                    value={scoreSearchTerm}
                    onChange={(e) => setScoreSearchTerm(e.target.value)}
                    className="pl-11 h-11 rounded-2xl border-zinc-200 focus-visible:ring-black text-sm"
                  />
                </div>
                
                <div className="relative">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTeamFilterOpen(!isTeamFilterOpen)}
                    className="w-full sm:w-48 xl:w-52 h-11 rounded-2xl border-zinc-200 focus:ring-black text-xs font-bold uppercase tracking-widest justify-between bg-white px-5"
                  >
                    <span className="truncate">
                      {teamFilter === 'all' ? 'All Units' : (allTeams.find(t => t._id === teamFilter)?.name || 'All Units')}
                    </span>
                    <Search className="ml-2 w-3 h-3 text-zinc-400" />
                  </Button>

                  {isTeamFilterOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[1001] bg-transparent" 
                        onClick={() => setIsTeamFilterOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-zinc-200 rounded-3xl shadow-2xl z-[1002] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                          <div 
                            onClick={() => { setTeamFilter('all'); setIsTeamFilterOpen(false); }}
                            className={`p-4 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 ${teamFilter === 'all' ? 'bg-zinc-50 text-black' : 'text-zinc-400'}`}
                          >
                            All Units
                          </div>
                          {allTeams.map(team => (
                            <div 
                              key={team._id}
                              onClick={() => { setTeamFilter(team._id); setIsTeamFilterOpen(false); }}
                              className={`p-4 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 ${teamFilter === team._id ? 'bg-zinc-50 text-black' : 'text-zinc-400'}`}
                            >
                              {team.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Badge variant="outline" className="bg-zinc-50 h-11 flex items-center px-4 border-zinc-200 text-zinc-900 font-bold rounded-2xl shadow-sm text-xs">{recentScores.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 h-16">
                      <TableHead className="pl-10 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Employee</TableHead>
                      <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Functional Unit</TableHead>
                      <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-center">Net Yield</TableHead>
                      <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-center">Metric</TableHead>
                      <TableHead className="text-right pr-10 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Protocol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {recentScores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-96 text-center text-zinc-400">
                            <div className="flex flex-col items-center gap-4 opacity-10">
                              <Trophy className="w-20 h-20" />
                              <p className="text-lg font-bold uppercase tracking-[0.2em]">Zero records found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentScores.map((score) => {
                          const assessment = getPerformanceMessage(score.totalCredits);
                          return (
                            <TableRow key={score._id} className="group hover:bg-gray-50/50 transition-colors h-20 border-zinc-50">
                              <TableCell className="pl-10">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900 text-base">{score.user?.name}</span>
                                  <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest">{score.user?.employeeId}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[9px] border-zinc-200 font-bold uppercase tracking-tight py-1 px-3 rounded-lg">{score.team?.name}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xl font-black text-gray-900 leading-none">{score.totalCredits}</span>
                                  <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-black transition-all duration-1000" 
                                      style={{ width: `${score.totalCredits}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`shadow-none font-bold px-3 py-1.5 rounded-xl border uppercase text-[9px] tracking-widest whitespace-nowrap ${assessment.color}`}>
                                  {assessment.title}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditScore(score)}
                                    className="h-9 w-9 rounded-xl text-zinc-400 hover:text-black hover:bg-[#fffe01]"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteScore(score._id)}
                                    className="h-9 w-9 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                </Table>
              </div>

              {/* Mobile Card-Based View */}
              <div className="lg:hidden p-4 space-y-4">
                {recentScores.length === 0 ? (
                  <div className="py-20 text-center text-zinc-400">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="text-base font-bold uppercase tracking-[0.2em]">Zero records</p>
                  </div>
                ) : (
                  recentScores.map((score) => {
                    const assessment = getPerformanceMessage(score.totalCredits);
                    return (
                      <Card key={score._id} className="p-5 rounded-2xl border-zinc-100 shadow-sm bg-white space-y-5 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                           <Trophy className="w-20 h-20 text-black" />
                        </div>
                        
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-zinc-100 uppercase font-black text-zinc-300 text-xs shadow-sm">
                               {score.user?.name?.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                               <span className="font-bold text-gray-900">{score.user?.name}</span>
                               <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-widest">{score.user?.employeeId}</span>
                             </div>
                          </div>
                          <Badge className={`shadow-none font-bold px-2 py-1 rounded-lg border uppercase text-[8px] tracking-widest ${assessment.color}`}>
                            {assessment.title}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Unit Deployment</span>
                            <div className="text-xs font-semibold text-gray-700 truncate">{score.team?.name}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Yield Score</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-gray-900">{score.totalCredits}</span>
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-black" 
                                  style={{ width: `${score.totalCredits}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                           <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">Protocol ID: {score._id.slice(-8)}</div>
                           <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditScore(score)}
                                className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border-zinc-200 hover:bg-[#fffe01] hover:border-black hover:text-black transition-all"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteScore(score._id)}
                                className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border-rose-100 text-rose-500 hover:bg-rose-50 transition-all"
                              >
                                Clear
                              </Button>
                           </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
            <div className="px-6 md:px-8 border-t border-gray-100 bg-gray-50/10">
              <PaginationControl 
                pagination={pagination} 
                onPageChange={handlePageChange} 
              />
            </div>
          </Card>

          <Card className="rounded-3xl border-dashed border-2 border-zinc-200 bg-zinc-50/20 p-6 md:p-10 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
               <HelpCircle className="w-64 h-64 text-black" />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 shrink-0">
                <HelpCircle className="w-8 h-8 text-zinc-400" />
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-gray-900 tracking-tight leading-none uppercase">Metric Protocol</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Established Excellence Guidelines</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                  {[
                    { label: "90-100: Excellent Performance", color: "bg-emerald-500" },
                    { label: "80-89: Good - Maintain", color: "bg-blue-500" },
                    { label: "70-79: Acceptable - Minor Imp.", color: "bg-amber-500" },
                    { label: "60-69: Below Expectation", color: "bg-orange-500" },
                    { label: "Below 60: Poor Performance", color: "bg-rose-500" }
                  ].map((guide, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-zinc-100/50 backdrop-blur-sm transition-all hover:bg-white hover:border-zinc-200 hover:shadow-sm">
                      <div className={`w-3 h-3 rounded-full ${guide.color} shadow-lg shadow-current/20`} />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-tighter">{guide.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-6 bg-white border-zinc-200">
          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">Delete Evaluation?</DialogTitle>
            <DialogDescription className="text-gray-500 text-base leading-relaxed">
              This action cannot be undone. This evaluation will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row items-center gap-3 mt-8 sm:justify-center">
            <DialogClose asChild>
              <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-medium text-gray-500 hover:bg-zinc-100 hover:text-black">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={confirmDelete} className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-medium shadow-lg shadow-rose-200">
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyScoring;

