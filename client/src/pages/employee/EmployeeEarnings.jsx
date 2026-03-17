import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  TrendingUp, 
  ShieldAlert, 
  Calendar, 
  Wallet,
  Zap,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const EmployeeEarnings = () => {
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/my-summary`, {
        headers: { 'x-auth-token': token }
      });
      setEarnings(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch earnings summary"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 bg-[#f8fafc] min-h-screen animate-in fade-in duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-600 font-bold">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs uppercase tracking-[0.2em]">Financial Transparency</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Earnings & Deductions</h1>
        <p className="text-slate-500 font-medium">Clear breakdown of your monthly salary based on system logs.</p>
      </header>

      {earnings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Earnings Card */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[3rem] border-0 shadow-[0_40px_80px_rgba(79,70,229,0.08)] bg-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                 <TrendingUp className="w-64 h-64 text-indigo-900 rotate-12" />
              </div>

              <div className="p-12 md:p-16 space-y-12 relative z-10">
                <div className="flex justify-between items-center">
                   <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base CTC Phase</span>
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter">₹{earnings.baseSalary.toLocaleString()}</h2>
                   </div>
                   <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-2 rounded-xl font-bold">LIVE ESTIMATE</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 text-emerald-600">
                         <Calendar className="w-5 h-5" />
                         <span className="text-xs font-black uppercase tracking-widest">Attendance Weight</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900">{earnings.presentDays} Days</div>
                      <p className="text-xs font-medium text-slate-400">Days accounted for (including Holidays/Sundays)</p>
                   </div>

                   <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 space-y-4">
                      <div className="flex items-center gap-3 text-rose-600">
                         <ShieldAlert className="w-5 h-5" />
                         <span className="text-xs font-black uppercase tracking-widest">LOP Deductions</span>
                      </div>
                      <div className="text-3xl font-black text-rose-600">-{earnings.totalLOPDays} Days</div>
                      <p className="text-xs font-medium text-rose-400">Loss of pay based on strict Mon/Sat & Leave policy.</p>
                   </div>
                </div>

                <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
                   <div className="space-y-4 w-full md:w-auto">
                      <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50/50 px-4 py-2 rounded-full w-fit">
                         <Zap className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Net Payable Calculation</span>
                      </div>
                      <p className="text-slate-500 font-medium max-w-sm">Calculated as (Base Salary / Days in Month) × (Month Days - LOP Days).</p>
                   </div>
                   <div className="text-right space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Disbursement</span>
                      <div className="text-6xl font-black text-indigo-600 tracking-tighter">₹{earnings.estimatedNetSalary.toLocaleString()}</div>
                   </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="rounded-[2.5rem] border-0 shadow-xl shadow-slate-200/30 bg-white p-8 space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <Info className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Permission Log</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{earnings.totalPermissionHours} hrs</div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Cumulative permissions used this month. Tiered deductions apply if limits are exceeded.
                  </p>
               </Card>

               <Card className="rounded-[2.5rem] border-0 shadow-xl shadow-slate-200/30 bg-white p-8 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Wallet className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Daily Rate (Est)</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹{Math.round(earnings.baseSalary / 30).toLocaleString()}</div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Current daily earning weight based on standard 30-day month logic.
                  </p>
               </Card>
            </div>
          </div>

          {/* Policy Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             <Card className="rounded-[2.5rem] border-0 shadow-xl bg-slate-900 text-white p-8 space-y-8 h-full">
                <div className="space-y-2">
                   <h3 className="text-xl font-black tracking-tight uppercase">Deduction Protocol</h3>
                   <div className="w-12 h-1.5 bg-indigo-500 rounded-full"></div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strict Rule 01</span>
                      <p className="text-sm font-bold text-slate-300">Monday & Saturday absences incur <span className="text-rose-400 uppercase">Double LOP</span> (2 days deduction).</p>
                   </div>
                   
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strict Rule 02</span>
                      <p className="text-sm font-bold text-slate-300">Unapproved absence on other days incurs 1 day LOP.</p>
                   </div>

                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strict Rule 03</span>
                      <p className="text-sm font-bold text-slate-300">Permissions exceeding 3 hours trigger <span className="text-amber-400 uppercase">Tier 1</span> deduction (0.5 day).</p>
                   </div>
                </div>

                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 italic">
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     "All calculations are system-generated based on biometric and manual check-in logs. Contact admin for discrepancy resolution."
                   </p>
                </div>
             </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeEarnings;
