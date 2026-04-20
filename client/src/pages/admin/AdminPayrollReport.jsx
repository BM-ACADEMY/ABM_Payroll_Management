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
  FileText,
  DollarSign,
  Download,
  Users2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
       }, 300);
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

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500 bg-gray-50/30 min-h-screen pb-32">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            Payroll <span className="text-[#d30614]">Center</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-normal">
            Generate reports, analyze compensation metrics, and manage employee payroll
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:bg-white text-sm"
              />
           </div>
           
           <Card className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm pr-6">
              <div className="p-3 bg-gray-900 text-[#fffe01] rounded-lg">
                 <Calculator className="w-5 h-5" />
              </div>
              <div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Summary</span>
                 <span className="text-sm font-bold text-gray-900">Payroll Generation</span>
              </div>
           </Card>
        </div>
      </header>

      {/* Main Table Content */}
      <Card className="border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
             <CardTitle className="text-xl font-bold flex items-center gap-2">
               <Users2 className="w-5 h-5 text-[#d30614]" /> Employee Registry
             </CardTitle>
             <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">Managing {pagination.total} personnel records</CardDescription>
          </div>
          <Button variant="outline" className="rounded-xl border-gray-200">
             <Download className="w-4 h-4 mr-2" /> Export All
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="pl-8 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Employee</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Contact Information</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Base Salary</TableHead>
                  <TableHead className="pr-8 h-14 text-right text-[10px] uppercase font-bold text-gray-400 tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="h-64 text-center"><Loader color="red" /></TableCell></TableRow>
                ) : employees.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-64 text-center text-gray-400">No employees found in current search</TableCell></TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp._id} className="hover:bg-gray-50/30 transition-all border-gray-50">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-[#fffe01] font-bold text-lg uppercase shadow-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span className="font-bold text-gray-900">{emp.name}</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">{emp.employeeId || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col text-xs space-y-0.5">
                           <span className="font-medium text-gray-600">{emp.email}</span>
                           <span className="text-gray-400">{emp.phoneNumber || 'No contact'}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <span className="font-bold text-gray-900">₹{emp.baseSalary?.toLocaleString() || '0'}</span>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                         <Button 
                           onClick={() => openGenerateModal(emp)}
                           className="h-10 rounded-xl bg-gray-900 text-[#fffe01] hover:bg-[#d30614] hover:text-white px-6 font-bold text-xs uppercase transition-all"
                         >
                            <Calculator className="w-4 h-4 mr-2" />
                            Generate
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="p-8 border-t border-gray-50 bg-gray-50/20">
          <PaginationControl 
            pagination={pagination} 
            onPageChange={handlePageChange} 
          />
        </div>
      </Card>

      {/* Salary Generation Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 rounded-3xl border-none shadow-2xl animate-in zoom-in-95 duration-300">
          <DialogHeader className="bg-gray-900 p-8 md:p-12 text-white text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
               <Calculator className="w-48 h-48" />
            </div>
            <DialogTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Payroll Computation</DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-medium uppercase tracking-widest">
              Generating financial report for <span className="text-white">{selectedEmployee?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 md:p-12 space-y-10">
            {!generatedSalary ? (
              <form onSubmit={handleGenerateSalary} className="space-y-10">
                <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 italic">
                   <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 font-bold text-2xl shadow-sm shrink-0">
                      {selectedEmployee?.name?.charAt(0).toUpperCase()}
                   </div>
                   <div className="space-y-1">
                     <h3 className="font-bold text-gray-900 text-xl tracking-tight">{selectedEmployee?.name}</h3>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">ID: {selectedEmployee?.employeeId} • Base: ₹{selectedEmployee?.baseSalary?.toLocaleString()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Start Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <Input 
                        type="date" 
                        required
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-12 pl-12 rounded-xl bg-gray-50 border-gray-100 text-sm font-bold focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">End Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <Input 
                        type="date" 
                        required
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-12 pl-12 rounded-xl bg-gray-50 border-gray-100 text-sm font-bold focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-50">
                  <Button type="button" variant="ghost" onClick={() => handleCloseModal(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] text-gray-400 hover:text-gray-900">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={generatingLoading} className="h-12 rounded-xl px-10 bg-gray-900 text-[#fffe01] hover:bg-[#d30614] hover:text-white font-bold shadow-lg transition-all uppercase tracking-widest text-[10px]">
                    {generatingLoading ? <Loader size="xs" color="yellow" /> : "Run Computation"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                   {[
                     { label: 'Total Span', value: generatedSalary.salaryDetails.totalDays, suffix: ' Days', icon: FileText, color: 'text-gray-500' },
                     { label: 'Presence', value: generatedSalary.salaryDetails.presentDays, suffix: ' Days', icon: CheckCircle2, color: 'text-emerald-500' },
                     { label: 'Absence', value: generatedSalary.salaryDetails.totalAbsentDays, suffix: ' Days', icon: X, color: 'text-red-500' },
                     { label: 'Permissions', value: generatedSalary.salaryDetails.totalPermissionHours, suffix: ' Hrs', icon: Clock, color: 'text-blue-500' },
                   ].map((item, i) => (
                     <div key={i} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">{item.value}<span className="text-xs font-normal text-gray-400 ml-1">{item.suffix}</span></p>
                     </div>
                   ))}
                </div>

                <div className="p-6 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-bold text-gray-900">LOP Deductions</p>
                        <p className="text-xs text-red-600 font-medium uppercase tracking-widest">Downtime analysis</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-4xl font-bold text-red-600">{generatedSalary.salaryDetails.singleLopDays}</span>
                      <span className="text-[10px] font-bold text-red-400 ml-2 uppercase">Days</span>
                   </div>
                </div>

                <div className="bg-gray-900 p-8 md:p-12 rounded-[2.5rem] text-white relative overflow-hidden">
                   <div className="relative z-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-1">
                            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Base Salary</p>
                            <p className="text-3xl font-bold">₹{generatedSalary.salaryDetails.baseSalary.toLocaleString()}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Daily Value</p>
                            <p className="text-3xl font-bold">₹{generatedSalary.salaryDetails.perDaySalary.toLocaleString()}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-red-500 font-bold text-[10px] uppercase tracking-widest">LOP Penalty</p>
                            <p className="text-3xl font-bold text-red-500">{generatedSalary.salaryDetails.totalLopDaysGenerated} Pts</p>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="space-y-2">
                             <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Net Generated Compensation</p>
                             <p className="text-6xl font-bold text-white tracking-tighter">
                                <span className="text-2xl text-[#fffe01] mr-2">₹</span>{generatedSalary.salaryDetails.netSalary.toLocaleString()}
                             </p>
                         </div>
                         <Button onClick={() => setGeneratedSalary(null)} variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 hover:text-white px-8">
                            Reset View
                         </Button>
                      </div>
                   </div>
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
