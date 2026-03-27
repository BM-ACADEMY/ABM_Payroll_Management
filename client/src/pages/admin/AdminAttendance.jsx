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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users2,
  UserCheck2,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  ChevronRight,
  ChevronLeft,
  CalendarCheck2,
  Calendar,
  ShieldAlert,
  CalendarDays,
  Edit,
  XCircle,
  Home,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { memo, useMemo, lazy, Suspense } from 'react';

const EmergencyModalContent = lazy(() => import('./EmergencyModalContent'));

const AttendanceRow = memo(({ item, onEdit }) => {
  return (
    <TableRow className="border-gray-100 hover:bg-gray-50/60 transition-all group">
      <TableCell className="px-10 py-6">
        <div className="flex flex-col gap-1.5">
          <span className="font-normal text-gray-900 text-lg tracking-tight leading-none">{item.user?.name}</span>
          <span className="text-xs font-normal text-gray-400 uppercase tracking-widest">{item.user?.employeeId || 'ID Pending'}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {item.isHoliday ? (
          <Badge variant="outline" className="font-medium text-[9px] bg-[#d30614]/10 text-[#d30614] border-[#d30614]/20 uppercase px-3 py-1 rounded-lg">Official Holiday</Badge>
        ) : (
          <div className="flex justify-center">
            {item.checkIn?.mode === 'WFH' ? (
              <Badge className="bg-gray-50 text-gray-700 border border-gray-200 uppercase text-[9px] font-medium h-7 rounded-sm px-2 gap-1.5 shadow-none">
                <Home className="w-3 h-3" /> WFH
              </Badge>
            ) : (
              <Badge className="bg-gray-50 text-gray-700 border border-gray-200 uppercase text-[9px] font-medium h-7 rounded-sm px-2 gap-1.5 shadow-none">
                <Building2 className="w-3 h-3" /> WFO
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        {item.isHoliday ? (
           <span className="text-gray-300 font-normal text-[10px] uppercase tracking-widest opacity-50">Station Reserved</span>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1.5 min-w-[5rem]">
              {item.schedule && (
                <span className="text-[9px] font-medium text-blue-600 uppercase tracking-tighter opacity-70">
                  Sch: {item.schedule.loginTime}
                </span>
              )}
              <span className={`px-4 py-1.5 rounded-full font-medium text-xs tracking-tighter w-20 text-center ${item.checkIn?.time ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-300 border border-gray-200'}`}>
                {item.checkIn?.time || '--:--'}
              </span>
              {item.checkIn?.permissionMinutes > 0 && (
                <span className="text-[9px] font-medium text-rose-500 uppercase tracking-tighter">Late By {Math.ceil(item.checkIn.permissionMinutes)} Min</span>
              )}
            </div>
            <span className="text-gray-300 font-light text-xs">→</span>
            <div className="flex flex-col items-center gap-1.5 min-w-[5rem]">
              {item.schedule && (
                <span className="text-[9px] font-medium text-blue-600 uppercase tracking-tighter opacity-70">
                  Sch: {item.schedule.logoutTime}
                </span>
              )}
              <span className={`px-4 py-1.5 rounded-full font-medium text-xs tracking-tighter w-20 text-center ${item.checkOut?.time ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-gray-50 text-gray-300 border border-gray-200'}`}>
                {item.checkOut?.time || '--:--'}
              </span>
            </div>
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        {!item.isHoliday && item.lunch?.out ? (
          <div className="flex flex-col items-center justify-center gap-1.5">
             {item.schedule && (
               <span className="text-[9px] font-medium text-blue-600 uppercase tracking-tighter opacity-70">
                 Limit: {item.schedule.lunchDuration}m
               </span>
             )}
             <Badge variant="outline" className="border-gray-200 text-gray-500 bg-gray-50 rounded-lg text-[9px] font-medium px-2 gap-1 h-7 uppercase tracking-wider">
                {item.lunch.out} - {item.lunch.in || 'PND'}
             </Badge>
          </div>
        ) : (
          <span className="text-gray-300 text-[9px] font-medium uppercase tracking-widest">No Break Logged</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {item.isHoliday ? (
          <Badge className="bg-[#d30614]/10 text-[#d30614] border border-[#d30614]/20 font-medium text-[9px] uppercase shadow-none px-3 py-1 rounded-sm">On Leave</Badge>
        ) : (
          <div className="flex justify-center">
            {item.checkIn?.status === 'absent' ? (
               <Badge className="font-medium text-[9px] uppercase shadow-none bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-sm hover:bg-rose-100">
                 ABSENT
               </Badge>
            ) : item.checkIn?.time ? (
               <Badge className="font-medium text-[9px] uppercase shadow-none bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-sm hover:bg-emerald-100">
                 VALIDATED
               </Badge>
            ) : (
               <Badge className="font-medium text-[9px] uppercase shadow-none bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-sm hover:bg-rose-100">
                 ABSENT
               </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center pr-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          className="text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

AttendanceRow.displayName = 'AttendanceRow';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    userId: '',
    checkInTime: '',
    checkOutTime: '',
    mode: 'WFO'
  });
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const { toast } = useToast();

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/admin/all?date=${date}`, {
        headers: { 'x-auth-token': token }
      });
      setAttendance(res.data);
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
    fetchAttendance();
  }, [date]);


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
      const token = sessionStorage.getItem('token');
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
    <div className="p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-black font-medium mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#d30614]/10 flex items-center justify-center shadow-sm">
              <UserCheck className="w-6 h-6 text-[#d30614]" />
            </div>
            <span className="text-sm tracking-[0.2em] uppercase font-medium text-[#d30614]">Operations Control</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900">
            Attendance <span className="text-[#d30614]">Monitoring</span>
          </h1>
          <p className="text-gray-500 font-normal max-w-xl leading-relaxed">Review real-time presence signatures and shift compliance across your workforce.</p>
        </div>
        
        <Card className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="space-y-1 px-2">
             <Label htmlFor="date-picker" className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Select Date</Label>
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black" />
                <Input 
                  id="date-picker"
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="border-none bg-transparent font-medium text-gray-900 focus-visible:ring-0 p-0 h-auto w-36"
                />
             </div>
          </div>
        </Card>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Present Personnel</p>
                <p className="text-3xl font-medium text-gray-900">{attendance.filter(a => a.checkIn?.time).length}</p>
             </div>
          </div>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#d30614] flex items-center justify-center text-white shadow-sm">
                <Users2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Total Records</p>
                <p className="text-3xl font-medium text-gray-900">{attendance.length}</p>
             </div>
          </div>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <CalendarCheck2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Late Arrivals</p>
                <p className="text-3xl font-medium text-gray-900">{attendance.filter(a => a.checkIn?.status === 'late').length}</p>
             </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-8 p-10 gap-6 border-b border-gray-100 bg-gray-50/30">
          <div className="space-y-1">
            <CardTitle className="text-2xl text-gray-900 font-medium flex items-center gap-3">
              <Users2 className="w-7 h-7 text-black" />
              Staff Logs for {format(new Date(date), 'MMMM dd, yyyy')}
            </CardTitle>
            <CardDescription className="text-gray-500 font-normal">Verification signatures for the requested operational cycle</CardDescription>
          </div>
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
            <Input 
              placeholder="Search name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-gray-200 pl-12 h-14 text-gray-900 font-normal rounded-2xl focus-visible:ring-black shadow-sm w-full" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-32 gap-4">
               <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-black animate-spin"></div>
               <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.4em]">Loading Logs...</span>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-32 space-y-4">
               <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                 <XCircle className="w-10 h-10 text-gray-300" />
               </div>
               <p className="text-gray-400 font-normal uppercase tracking-widest text-xs">No activity detected for this date.</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-32">
               <p className="text-gray-400 font-normal">No results found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-gray-100">
                    <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-[0.2em] px-10 h-14">Staff Member</TableHead>
                    <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-[0.2em] text-center">Environment</TableHead>
                    <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-[0.2em] text-center">Session Activity</TableHead>
                    <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-[0.2em] text-center">Lunch Protocol</TableHead>
                    <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-[0.2em] text-center">Validation</TableHead>
                    <TableHead className="text-gray-500 font-medium text-[10px] uppercase tracking-[0.2em] text-center pr-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((item) => (
                    <AttendanceRow key={item._id} item={item} onEdit={handleEditClick} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center pt-6 opacity-30">
         <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-[0.4em]">
            <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
            End of Operational Cycle
         </div>
      </div>

      {/* Emergency Override Modal */}
      <Dialog open={isEmergencyModalOpen} onOpenChange={setIsEmergencyModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-gray-200">
          <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
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
