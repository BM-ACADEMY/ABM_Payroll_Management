import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Users2,
  UserCheck2,
  Clock,
  Search,
  Filter,
  Download,
  CalendarCheck2,
  Calendar,
  ShieldAlert,
  Edit,
  XCircle,
  Home,
  Building2,
  MapPin,
  CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { memo, useMemo, lazy, Suspense } from 'react';
import PaginationControl from '@/components/ui/PaginationControl';
import Loader from "@/components/ui/Loader";

const EmergencyModalContent = lazy(() => import('./EmergencyModalContent'));

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState({ userId: '', checkInTime: '', checkOutTime: '', mode: 'WFO' });
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });

  const { toast } = useToast();

  const fetchAttendance = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/admin/all?date=${date}&page=${page}&limit=10`, {
        headers: { 'x-auth-token': token }
      });
      setAttendance(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch attendance records",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(1);
  }, [date]);

  const handlePageChange = (page) => {
    fetchAttendance(page);
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    if (!emergencyData.userId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Employee and Check In Time are required.",
      });
      return;
    }

    setEmergencyLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/admin/emergency`, {
        ...emergencyData,
        date
      }, {
        headers: { 'x-auth-token': token }
      });
      
      toast({
        title: "Success",
        description: "Attendance overridden successfully.",
      });
      setIsEmergencyModalOpen(false);
      setEmergencyData({ userId: '', checkInTime: '', checkOutTime: '', mode: 'WFO' });
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to override attendance",
      });
    } finally {
      setEmergencyLoading(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(item => 
      item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.user?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attendance, searchTerm]);

  const handleEditClick = (item) => {
    setEmergencyData({
      userId: item.user._id,
      checkInTime: item.checkIn?.time || '',
      checkOutTime: item.checkOut?.time || '',
      mode: item.checkIn?.mode || 'WFO'
    });
    setIsEmergencyModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500 bg-gray-50/30 min-h-screen pb-32">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900 leading-tight">
            Staff <span className="text-[#d30614]">Attendance</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-normal">
            Monitor daily logs, manage overrides, and analyze workforce presence
          </p>
        </div>
        
        <Card className="p-4 bg-white border-gray-100 shadow-sm rounded-2xl flex items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex-1 md:flex-initial">
            <Calendar className="w-4 h-4 text-[#d30614]" />
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="border-none bg-transparent font-bold text-gray-900 focus-visible:ring-0 p-0 h-auto w-full md:w-32"
            />
          </div>
          <Button variant="outline" className="rounded-xl border-gray-200">
             <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </Card>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-100 shadow-sm bg-white rounded-2xl p-6">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Present Today</p>
                <p className="text-3xl font-bold text-gray-900">{attendance.filter(a => a.checkIn?.time).length}</p>
             </div>
          </div>
        </Card>
        
        <Card className="border-gray-100 shadow-sm bg-gray-900 text-white rounded-2xl p-6">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-xl bg-[#fffe01] text-black flex items-center justify-center shadow-lg shadow-yellow-400/10">
                <Users2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Total Workforce</p>
                <p className="text-3xl font-bold text-white">{attendance.length}</p>
             </div>
          </div>
        </Card>

        <Card className="border-gray-100 shadow-sm bg-white rounded-2xl p-6">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarCheck2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Late Logins</p>
                <p className="text-3xl font-bold text-gray-900">{attendance.filter(a => a.checkIn?.status === 'late').length}</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Main Table Content */}
      <Card className="border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#d30614]" /> Attendance Records
            </CardTitle>
            <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">{format(new Date(date), 'MMMM dd, yyyy')}</CardDescription>
          </div>
          
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border-gray-100 pl-10 h-12 rounded-xl focus:bg-white text-sm" 
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="py-32 flex flex-col items-center gap-4">
               <Loader size="lg" color="red" />
               <span className="text-xs font-medium text-gray-400">Syncing workforce data...</span>
            </div>
          ) : attendance.length === 0 ? (
            <div className="py-32 text-center space-y-4">
               <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                 <XCircle className="w-8 h-8 text-gray-200" />
               </div>
               <p className="text-gray-400 font-medium text-sm">No attendance records found for this date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="pl-8 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Employee</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Mode</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Login / Logout</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Break Interval</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Status</TableHead>
                    <TableHead className="pr-8 h-14 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((item) => (
                    <TableRow key={item._id} className="hover:bg-gray-50/30 transition-all border-gray-50">
                      <TableCell className="pl-8 py-5">
                         <div className="flex flex-col leading-tight">
                            <span className="font-bold text-gray-900">{item.user?.name}</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">{item.user?.employeeId || 'N/A'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         {item.isHoliday ? (
                           <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 text-[9px] font-bold uppercase py-1">HOLIDAY</Badge>
                         ) : (
                           <Badge variant="outline" className="bg-white border-gray-200 text-gray-600 text-[9px] font-bold uppercase py-1 h-7 inline-flex gap-1.5 px-3">
                             {item.checkIn?.mode === 'WFH' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                             {item.checkIn?.mode || 'OFFICE'}
                           </Badge>
                         )}
                      </TableCell>
                      <TableCell>
                         {!item.isHoliday && (
                           <div className="flex items-center justify-center gap-4">
                              <div className="flex flex-col items-center gap-1 min-w-[70px]">
                                <span className={`text-[9px] font-bold rounded-lg px-2 py-0.5 ${item.checkIn?.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {item.checkIn?.time || '--:--'}
                                </span>
                                {item.checkIn?.location && (
                                   <a href={`https://www.google.com/maps?q=${item.checkIn.location.lat},${item.checkIn.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#d30614]"><MapPin className="w-3 h-3" /></a>
                                )}
                              </div>
                              <span className="text-gray-200">/</span>
                              <div className="flex flex-col items-center gap-1 min-w-[70px]">
                                <span className="bg-gray-900 text-white text-[9px] font-bold rounded-lg px-2 py-0.5">
                                  {item.checkOut?.time || '--:--'}
                                </span>
                                {item.checkOut?.location && (
                                   <a href={`https://www.google.com/maps?q=${item.checkOut.location.lat},${item.checkOut.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#d30614]"><MapPin className="w-3 h-3" /></a>
                                )}
                              </div>
                           </div>
                         )}
                      </TableCell>
                      <TableCell className="text-center">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                           {item.lunch?.out ? `${item.lunch.out} - ${item.lunch.in || 'PND'}` : '--:--'}
                         </span>
                      </TableCell>
                      <TableCell className="text-center">
                         {item.isHoliday ? (
                           <Badge className="bg-red-50 text-red-700 border-none font-bold text-[9px] uppercase">LEAVE</Badge>
                         ) : (
                           <Badge className={`font-bold text-[9px] uppercase border-none ${item.checkIn?.time ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {item.checkIn?.time ? 'PRESENT' : 'PENDING'}
                           </Badge>
                         )}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                         <Button
                           onClick={() => handleEditClick(item)}
                           variant="ghost"
                           size="icon"
                           className="h-9 w-9 text-gray-400 hover:text-[#d30614] hover:bg-red-50 rounded-xl"
                         >
                           <Edit className="w-4 h-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <div className="p-8 border-t border-gray-50 bg-gray-50/20 flex justify-center">
           <PaginationControl 
             pagination={pagination} 
             onPageChange={handlePageChange} 
           />
        </div>
      </Card>

      <Dialog open={isEmergencyModalOpen} onOpenChange={setIsEmergencyModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
          <Suspense fallback={<div className="p-20 flex justify-center"><Loader color="red" /></div>}>
            {isEmergencyModalOpen && (
              <EmergencyModalContent 
                date={date}
                emergencyData={emergencyData}
                setEmergencyData={setEmergencyData}
                attendance={attendance}
                onSubmit={handleEmergencySubmit}
                onClose={() => setIsEmergencyModalOpen(false)}
                loading={emergencyLoading}
              />
            )}
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAttendance;
