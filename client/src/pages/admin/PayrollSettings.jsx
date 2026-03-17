import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Save, 
  Clock, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import axios from 'axios';

const PayrollSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settings, setSettings] = useState({
    monthlyPermissionHours: 3,
    casualLeaveLimit: 1,
    halfDaySalaryRateLimit: 0.5,
    fullDaySalaryRateLimit: 1.0
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, {
        headers: { 'x-auth-token': token }
      });
      setSettings(res.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: parseFloat(e.target.value) || 0 });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings`, settings, {
        headers: { 'x-auth-token': token }
      });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update settings.' });
    } finally {
      setSaveLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-xs tracking-widest uppercase">System Config</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Payroll Settings</h1>
          <p className="text-slate-500 font-medium">Manage global limits and salary rate calculation rules.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Permission & Leave Limits
                </CardTitle>
                <CardDescription className="font-medium">Define monthly allowances for employees.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                      Monthly Permission Hours
                    </Label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        type="number"
                        name="monthlyPermissionHours"
                        value={settings.monthlyPermissionHours}
                        onChange={handleChange}
                        step="0.5"
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-slate-700"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Maximum allowed permission hours per month.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                      Casual Leave Limit
                    </Label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        type="number"
                        name="casualLeaveLimit"
                        value={settings.casualLeaveLimit}
                        onChange={handleChange}
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-slate-700"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Number of casual leaves granted per month.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Salary Rate Multipliers
                </CardTitle>
                <CardDescription className="font-medium">Configure calculation rules for attendance types.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                      Half-Day Salary Multiplier
                    </Label>
                    <div className="relative group">
                      <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        type="number"
                        name="halfDaySalaryRateLimit"
                        value={settings.halfDaySalaryRateLimit}
                        onChange={handleChange}
                        step="0.01"
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-slate-700"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Multiplier applied to basic salary for half-days.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                      Full-Day Salary Multiplier
                    </Label>
                    <div className="relative group">
                      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        type="number"
                        name="fullDaySalaryRateLimit"
                        value={settings.fullDaySalaryRateLimit}
                        onChange={handleChange}
                        step="0.01"
                        className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-slate-700"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Default multiplier for regular working days.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={saveLoading}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {saveLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              ) : (
                <Save className="w-6 h-6 mr-2" />
              )}
              Save Global Settings
            </Button>
          </form>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-lg rounded-[2rem] bg-indigo-600 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Usage Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                Changes made here will affect <strong>all future payroll calculations</strong> across the entire system.
              </p>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                Ensure multipliers are mathematically correct to avoid incorrect salary disbursements.
              </p>
            </CardContent>
          </Card>

          {message.text && (
            <div className={`p-6 rounded-[2rem] flex items-center gap-4 transition-all animate-in slide-in-from-top-4 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 shrink-0" />
              )}
              <p className="font-bold">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSettings;
