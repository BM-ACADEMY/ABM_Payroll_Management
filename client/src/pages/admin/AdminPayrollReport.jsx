import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  Search, 
  User, 
  Calendar as CalendarIcon,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  X,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";

const AdminPayrollReport = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  
  // Salary Generation Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [generatingLoading, setGeneratingLoading] = useState(false);
  
  // Generated Salary Details
  const [generatedSalary, setGeneratedSalary] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    fetchEmployees(page);
  };

  const resetDates = () => {
    const d = new Date();
    setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
    setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
  };

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?page=${page}&limit=5&name=${searchTerm}`, {
        headers: { 'x-auth-token': token }
      });
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch employees list"
      });
    } finally {
      setLoading(false);
    }
  };

  const openGenerateModal = (emp) => {
    setSelectedEmployee(emp);
    setGeneratedSalary(null);
    resetDates();
    setIsGenerateOpen(true);
  };

  const handleCloseModal = (open) => {
    setIsGenerateOpen(open);
    if (!open) {
       setTimeout(() => {
          setSelectedEmployee(null);
          setGeneratedSalary(null);
          resetDates();
       }, 300); // clear after animation
    }
  };

  const handleGenerateSalary = async (e) => {
    e.preventDefault();
    setGeneratingLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payroll/generate/${selectedEmployee._id}?startDate=${startDate}&endDate=${endDate}`,
        { headers: { 'x-auth-token': token } }
      );
      setGeneratedSalary(res.data);
      toast({
        title: "Success",
        description: "Salary generated successfully"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to generate salary"
      });
    } finally {
      setGeneratingLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-black font-medium">
            <Calculator className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Salary Engine</span>
          </div>
          <h1 className="text-4xl font-medium text-slate-900 tracking-tight">Generate Salary</h1>
          <p className="text-slate-500 font-medium">Search for an employee and calculate their salary for a specific period.</p>
        </div>
      </header>

      <Card className="rounded-[3rem] border-0 shadow-2xl shadow-slate-200/40 bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="space-y-1 w-full xl:w-auto">
             <CardTitle className="text-2xl font-medium tracking-tight text-slate-900">Employee Select</CardTitle>
             <CardDescription className="text-slate-500 font-medium">Search by name, ID, email or phone to generate payroll.</CardDescription>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search employee..." 
              className="pl-11 pr-6 py-3 w-full rounded-2xl border-2 border-slate-100 focus:border-black bg-slate-50 font-medium transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="py-6 px-8 text-[10px] font-medium uppercase tracking-widest text-slate-400">Employee Details</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-medium uppercase tracking-widest text-slate-400">Contact</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-medium uppercase tracking-widest text-slate-400">Base Salary</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-medium uppercase tracking-widest text-slate-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    <Loader size="md" color="red" />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium">No employees found.</TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp._id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-black font-medium shadow-inner">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 tracking-tight">{emp.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{emp.employeeId || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                       <div className="flex flex-col">
                         <span className="font-medium text-slate-700">{emp.email}</span>
                         <span className="text-xs text-slate-400">{emp.phoneNumber || 'N/A'}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 font-bold text-slate-600">₹{emp.baseSalary?.toLocaleString() || '0'}</TableCell>
                    <TableCell className="py-6 px-8 text-right">
                       <Button 
                         onClick={() => openGenerateModal(emp)}
                         className="h-10 rounded-xl bg-black text-[#fffe01] hover:bg-zinc-900 shadow-md px-6 flex items-center gap-2 transition-all font-bold"
                       >
                          <Calculator className="w-4 h-4" />
                          Generate Salary
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* Salary Generation Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-0 rounded-3xl">
          <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-medium text-slate-900 tracking-tight">Generate Salary</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1">
                Calculate {selectedEmployee?.name}'s salary for a specific duration.
              </DialogDescription>
            </div>
          </div>

          <div className="p-8">
            {!generatedSalary ? (
              <form onSubmit={handleGenerateSalary} className="space-y-6">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                   <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-[#fffe01] font-medium text-lg">
                      {selectedEmployee?.name?.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900 text-lg">{selectedEmployee?.name}</h3>
                     <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{selectedEmployee?.employeeId}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400">Start Date</Label>
                    <Input 
                      type="date" 
                      required
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-widest text-slate-400">End Date</Label>
                    <Input 
                      type="date" 
                      required
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => handleCloseModal(false)} className="rounded-xl h-12 px-6 font-bold text-slate-600 border-slate-200">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={generatingLoading} className="rounded-xl h-12 px-8 bg-black hover:bg-zinc-900 text-[#fffe01] font-bold shadow-lg flex items-center gap-2">
                    {generatingLoading ? (
                      <Loader size="sm" color="white" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    Generate Statement
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-[#fffe01] font-medium text-2xl shadow-lg">
                        {generatedSalary.employee.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <h3 className="font-medium text-slate-900 text-2xl tracking-tight">{generatedSalary.employee.name}</h3>
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{generatedSalary.employee.employeeId} • {generatedSalary.employee.email}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Period Selected</p>
                     <p className="font-bold text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg text-sm">
                       {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
                     </p>
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                     <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-1">Total Days</p>
                     <p className="text-2xl font-medium text-slate-900">{generatedSalary.salaryDetails.totalDays} <span className="text-sm text-slate-400">days</span></p>
                   </div>
                   <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                     <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-600/70 mb-1">Present</p>
                     <p className="text-2xl font-medium text-emerald-700">{generatedSalary.salaryDetails.presentDays} <span className="text-sm">days</span></p>
                   </div>
                   <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                     <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600/70 mb-1">Absent (Raw)</p>
                     <p className="text-2xl font-medium text-amber-700">{generatedSalary.salaryDetails.totalAbsentDays} <span className="text-sm">days</span></p>
                   </div>
                   <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100/50">
                     <p className="text-[10px] font-medium uppercase tracking-widest text-cyan-600/70 mb-1">Casual Leave</p>
                     <p className="text-2xl font-medium text-cyan-700">{generatedSalary.salaryDetails.casualLeaveTaken} <span className="text-sm">taken</span></p>
                   </div>
                   <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200/50">
                     <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 mb-1">Permissions</p>
                     <p className="text-2xl font-medium text-black">{generatedSalary.salaryDetails.totalPermissionHours} <span className="text-sm">hrs</span></p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   <div className="p-5 rounded-2xl border-2 border-rose-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-rose-100 text-rose-600"><TrendingDown className="w-5 h-5"/></div>
                         <div>
                           <p className="font-bold text-slate-900">Total LOP Days</p>
                           <p className="text-xs font-medium text-slate-500">Regular absent deductions</p>
                         </div>
                      </div>
                      <span className="text-2xl font-medium text-rose-600">{generatedSalary.salaryDetails.singleLopDays}</span>
                   </div>
                </div>

                <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] text-[#fffe01] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <FileText className="w-32 h-32" />
                   </div>
                   <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-2 text-[#fffe01] font-medium text-sm uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" />
                        Final Computation
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                         <div>
                            <p className="text-slate-400 font-medium text-sm mb-1">Base Salary</p>
                            <p className="text-xl font-bold">₹{generatedSalary.salaryDetails.baseSalary.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-slate-400 font-medium text-sm mb-1">Per Day Salary</p>
                            <p className="text-xl font-bold">₹{generatedSalary.salaryDetails.perDaySalary.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-rose-400 font-medium text-sm mb-1">Total LOP Penalty</p>
                            <p className="text-xl font-bold text-rose-300">{generatedSalary.salaryDetails.totalLopDaysGenerated} days</p>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800 flex items-end justify-between">
                         <div>
                             <p className="text-[#fffe01] font-medium uppercase tracking-widest text-xs mb-2">Net Generated Salary</p>
                            <p className="text-4xl sm:text-5xl font-medium tracking-tighter text-white">
                               ₹{generatedSalary.salaryDetails.netSalary.toLocaleString()}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-end">
                   <Button onClick={() => setGeneratedSalary(null)} variant="outline" className="rounded-xl h-12 px-8 font-bold text-slate-600 border-slate-200">
                     Recalculate or Change Dates
                   </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default AdminPayrollReport;


