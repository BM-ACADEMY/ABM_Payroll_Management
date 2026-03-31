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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#fffe01] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Weekly <span className="text-[#d30614]">Scoring</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal">Evaluate employee performance and assign weekly credits</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm w-full md:w-auto">
          <Calendar className="w-5 h-5 text-zinc-400 ml-2" />
          <div className="flex flex-col pr-4">
            <span className="text-[10px] uppercase text-zinc-400 font-medium">Select Week (Mon)</span>
            <Input 
              type="date" 
              value={weekStart} 
              onChange={(e) => setWeekStart(e.target.value)} 
              className="border-none p-0 h-auto focus-visible:ring-0 text-sm font-medium bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-8">
          <Card className="rounded-3xl border-zinc-200 shadow-sm bg-white relative z-50">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Employee
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Employee</Label>
                <div className="relative">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <Input 
                      placeholder="Search employee by name or ID..." 
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        if (!isMembersModalOpen) setIsMembersModalOpen(true); // Re-using state for dropdown visibility
                      }}
                      onFocus={() => setIsMembersModalOpen(true)}
                      className="pl-11 h-12 rounded-xl border-zinc-200 focus-visible:ring-black placeholder:text-zinc-400"
                    />
                  </div>

                  {isMembersModalOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[999] bg-transparent" 
                        onClick={() => setIsMembersModalOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {(Array.isArray(employees) ? employees : []).filter(emp => 
                            (emp.name || "").toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
                            (emp.employeeId || "").toLowerCase().includes(memberSearchTerm.toLowerCase())
                          ).length === 0 ? (
                            <div className="p-8 text-center text-zinc-400">
                              <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-xs">No employees found matching "{memberSearchTerm}"</p>
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
                                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 ${selectedEmployee?._id === emp._id ? 'bg-zinc-50' : ''}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-black">{emp.name}</span>
                                    <span className="text-[10px] uppercase text-zinc-400 font-medium">{emp.employeeId}</span>
                                  </div>
                                  {selectedEmployee?._id === emp._id && <CheckCircle2 className="w-4 h-4 text-black" />}
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
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-zinc-500">Select Role/Team</Label>
                    <Badge variant="outline" className="bg-zinc-50 font-normal text-[10px]">{selectedEmployee.teams?.length || 0} Assigned</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedEmployee.teams?.map(team => (
                      <div 
                        key={team._id}
                        onClick={() => handleTeamChange(team._id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group min-h-[56px] ${selectedTeam?._id === team._id ? 'border-black bg-zinc-50 shadow-sm' : 'border-zinc-100 hover:border-zinc-200 bg-white'}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-black">{team.name}</span>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-tight">{team.questions?.length || 0} Criteria</span>
                        </div>
                        {selectedTeam?._id === team._id ? (
                           <div className="bg-black text-[#fffe01] rounded-full p-1 shadow-sm">
                             <CheckCircle2 className="w-4 h-4" />
                           </div>
                        ) : (
                           <div className="w-5 h-5 rounded-full border-2 border-zinc-100 group-hover:border-zinc-300 transition-colors" />
                        )}
                      </div>
                    ))}
                  </div>
                  {(!selectedEmployee.teams || selectedEmployee.teams.length === 0) && (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-rose-100 bg-rose-50/30 text-center space-y-2">
                       <HelpCircle className="w-8 h-8 text-rose-300 mx-auto" />
                       <p className="text-xs text-rose-500 font-medium">No teams assigned to this employee.</p>
                       <p className="text-[10px] text-rose-400">Assign teams in Employee Directory first.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTeam && (
            <Card className="rounded-3xl border-zinc-200 shadow-sm overflow-hidden bg-white animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-black text-[#fffe01]">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Evaluation: {selectedTeam.name}</CardTitle>
                    <CardDescription className="text-zinc-400">Week of {format(new Date(weekStart), 'MMM dd, yyyy')}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-zinc-400 font-medium">Total Credits</p>
                    <p className="text-2xl font-bold">{totalScore}<span className="text-sm font-normal text-zinc-500"> /100</span></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSubmit}>
                  <div className="p-6 space-y-6">
                    {answers.map((ans, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 group-hover:bg-white transition-colors">
                          <Label className="text-sm font-medium text-gray-700 flex-1">{ans.questionText}</Label>
                          <div className="flex items-center gap-2 shrink-0">
                            <Input 
                              type="number"
                              min="0"
                              max={ans.maxCredits}
                              value={ans.creditsReceived}
                              onChange={(e) => handleScoreChange(idx, e.target.value)}
                              className="w-20 h-11 text-center font-bold text-lg rounded-xl border-zinc-200 focus-visible:ring-black"
                            />
                            <div className="flex flex-col -space-y-1">
                              <span className="text-[10px] uppercase text-zinc-400 font-bold">Max</span>
                              <span className="text-sm font-bold text-zinc-900">{ans.maxCredits}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="space-y-2 pt-4 border-t border-zinc-100">
                      <Label>Final Feedback / Comments</Label>
                        <Textarea 
                          placeholder="Write something encouraging or points for improvement..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="rounded-xl border-zinc-200 min-h-[80px] focus-visible:ring-black resize-none"
                        />
                      </div>
                  </div>
                  <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-[#d30614] hover:bg-red-700 text-white h-14 rounded-2xl text-lg font-medium shadow-lg shadow-red-600/10">
                      {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-7 space-y-8">
          <Card className="rounded-3xl border-zinc-200 shadow-sm overflow-hidden bg-white min-h-[400px]">
            <CardHeader className="border-b border-zinc-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Evaluations
                </CardTitle>
                <CardDescription>Scores submitted for the week of {format(new Date(weekStart), 'MMM dd')}</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative w-full md:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    placeholder="Search name..." 
                    value={scoreSearchTerm}
                    onChange={(e) => setScoreSearchTerm(e.target.value)}
                    className="pl-9 h-9 rounded-xl border-zinc-200 focus-visible:ring-black text-xs"
                  />
                </div>
                
                <div className="relative">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTeamFilterOpen(!isTeamFilterOpen)}
                    className="w-full md:w-40 h-9 rounded-xl border-zinc-200 focus:ring-black text-xs font-normal justify-between bg-white"
                  >
                    <span className="truncate">
                      {teamFilter === 'all' ? 'All Teams' : (allTeams.find(t => t._id === teamFilter)?.name || 'All Teams')}
                    </span>
                    <Search className="ml-2 w-3 h-3 text-zinc-400" />
                  </Button>

                  {isTeamFilterOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[1001] bg-transparent" 
                        onClick={() => setIsTeamFilterOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[1002] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          <div 
                            onClick={() => { setTeamFilter('all'); setIsTeamFilterOpen(false); }}
                            className={`p-3 text-xs cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 ${teamFilter === 'all' ? 'bg-zinc-50 font-semibold' : ''}`}
                          >
                            All Teams
                          </div>
                          {allTeams.map(team => (
                            <div 
                              key={team._id}
                              onClick={() => { setTeamFilter(team._id); setIsTeamFilterOpen(false); }}
                              className={`p-3 text-xs cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 ${teamFilter === team._id ? 'bg-zinc-50 font-semibold' : ''}`}
                            >
                              {team.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Badge variant="outline" className="bg-zinc-50 self-start md:self-auto h-9 flex items-center px-3 border-zinc-200 text-zinc-500 font-medium">{recentScores.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                    <TableHead className="w-[200px] font-medium text-zinc-500">Employee</TableHead>
                    <TableHead className="font-medium text-zinc-500">Team</TableHead>
                    <TableHead className="font-medium text-zinc-500 text-center">Total Credits</TableHead>
                    <TableHead className="font-medium text-zinc-500 text-center">Assessment</TableHead>
                    <TableHead className="text-right font-medium text-zinc-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {recentScores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center text-zinc-400">
                          <Trophy className="w-10 h-10 mx-auto mb-2 opacity-10" />
                          No evaluations found for this week.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentScores.map((score) => {
                        const assessment = getPerformanceMessage(score.totalCredits);
                        return (
                          <TableRow key={score._id} className="group hover:bg-zinc-50/50 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-black">{score.user?.name}</span>
                                <span className="text-[10px] uppercase text-zinc-400 font-mono tracking-tighter">{score.user?.employeeId}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] border-zinc-200 font-normal">{score.team?.name}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-lg font-bold">{score.totalCredits}</span>
                                <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden mt-1">
                                  <div 
                                    className="h-full bg-black" 
                                    style={{ width: `${score.totalCredits}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`shadow-none font-medium px-2 py-0.5 rounded-lg border uppercase text-[10px] ${assessment.color}`}>
                                {assessment.title}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEditScore(score)}
                                  className="h-8 w-8 text-zinc-400 hover:text-black"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteScore(score._id)}
                                  className="h-8 w-8 text-zinc-400 hover:text-rose-500"
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
              </CardContent>
              <div className="px-6 border-t border-gray-100 bg-gray-50/10">
                <PaginationControl 
                  pagination={pagination} 
                  onPageChange={handlePageChange} 
                />
              </div>
            </Card>

          <Card className="rounded-3xl border-dashed border-2 border-zinc-200 bg-transparent p-8">
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                <HelpCircle className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 leading-none">Scoring Guidelines</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>90-100: Excellent Performance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>80-89: Good - Maintain</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>70-79: Acceptable - Minor Imp.</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>60-69: Below Expectation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Below 60: Poor Performance</span>
                  </div>
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
