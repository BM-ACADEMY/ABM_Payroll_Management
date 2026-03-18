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
  Users, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Coffee,
  Building2,
  Home,
  UserCheck,
  ShieldAlert,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  
  const [employees, setEmployees] = useState([]);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    userId: '',
    checkInTime: '',
    checkOutTime: '',
    mode: 'WFO',
    status: 'on-time'
  });
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const { toast } = useToast();

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees`, {
          headers: { 'x-auth-token': token }
        });
        setEmployees(res.data);
      } catch (err) {
        console.error("Error fetching employees", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    if (!emergencyData.userId || !emergencyData.checkInTime) {
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
      setEmergencyData({ userId: '', checkInTime: '', checkOutTime: '', mode: 'WFO', status: 'on-time' });
      fetchAttendance(); // Refresh table
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

  const filteredAttendance = attendance.filter(item => 
    item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.user?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-indigo-600 font-bold mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-sm tracking-[0.2em] uppercase font-black text-indigo-600">Operations Control</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Attendance Monitoring</h1>
          <p className="text-slate-600 font-medium max-w-xl leading-relaxed">Review real-time presence signatures and shift compliance across your workforce.</p>
        </div>
        
        <Card className="p-4 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/40 flex items-center gap-4">
          <div className="space-y-1 px-2">
             <Label htmlFor="date-picker" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Protocol Date</Label>
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <Input 
                  id="date-picker"
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="border-none bg-transparent font-black text-slate-900 focus-visible:ring-0 p-0 h-auto w-36"
                />
             </div>
          </div>
        </Card>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-2 border-slate-100 shadow-sm rounded-[2rem] p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present Personnel</p>
                <p className="text-3xl font-black text-slate-900">{attendance.filter(a => a.checkIn?.time).length}</p>
             </div>
          </div>
        </Card>
        <Card className="bg-white border-2 border-slate-100 shadow-sm rounded-[2rem] p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Records</p>
                <p className="text-3xl font-black text-slate-900">{attendance.length}</p>
             </div>
          </div>
        </Card>
        <Card className="bg-white border-2 border-slate-100 shadow-sm rounded-[2rem] p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late Arrivals</p>
                <p className="text-3xl font-black text-slate-900">{attendance.filter(a => a.checkIn?.status === 'late').length}</p>
             </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white border-2 border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)] rounded-[3rem] overflow-hidden">
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-8 p-10 gap-6 border-b border-slate-50 bg-slate-50/30">
          <div className="space-y-1">
            <CardTitle className="text-2xl text-slate-900 font-black flex items-center gap-3">
              <Users className="w-7 h-7 text-indigo-600" />
              Staff Logs for {format(new Date(date), 'MMMM dd, yyyy')}
            </CardTitle>
            <CardDescription className="text-slate-600 font-bold italic">Verification signatures for the requested operational cycle</CardDescription>
          </div>
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Search name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-slate-100 pl-12 h-14 text-slate-900 font-medium rounded-2xl focus-visible:ring-indigo-500 shadow-sm w-full" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-32 gap-4">
               <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Deciphering Logs...</span>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-32 space-y-4">
               <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                 <XCircle className="w-10 h-10 text-slate-200" />
               </div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No activity signatures detected for this date.</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-32">
               <p className="text-slate-500 font-black">No results found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] px-10 h-14">Staff Member</TableHead>
                    <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-center">Environment</TableHead>
                    <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-center">Session Activity</TableHead>
                    <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-center">Lunch Protocol</TableHead>
                    <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-center">Validation</TableHead>
                    <TableHead className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] text-center pr-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((item) => (
                    <TableRow key={item._id} className="border-slate-50 hover:bg-slate-50/80 transition-all group">
                      <TableCell className="px-10 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-black text-slate-900 text-lg tracking-tight leading-none">{item.user?.name}</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.user?.employeeId || 'ID Pending'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isHoliday ? (
                          <Badge variant="outline" className="font-black text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200 uppercase px-3 py-1 rounded-lg">Official Holiday</Badge>
                        ) : (
                          <div className="flex justify-center">
                            {item.checkIn?.mode === 'WFH' ? (
                              <Badge className="bg-blue-50 text-blue-600 border border-blue-100 uppercase text-[9px] font-black h-7 rounded-sm px-2 gap-1.5 shadow-none">
                                <Home className="w-3 h-3" /> WFH
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-600 border border-blue-100 uppercase text-[9px] font-black h-7 rounded-sm px-2 gap-1.5 shadow-none">
                                <Building2 className="w-3 h-3" /> WFO
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isHoliday ? (
                           <span className="text-slate-300 font-black italic text-[10px] uppercase tracking-widest opacity-50">Station Reserved</span>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center gap-1.5 min-w-[5rem]">
                              <span className={`px-4 py-1.5 rounded-full font-black text-xs tracking-tighter w-20 text-center ${item.checkIn?.time ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                {item.checkIn?.time || '--:--'}
                              </span>
                              {item.checkIn?.permissionMinutes > 0 && (
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Late By {Math.ceil(item.checkIn.permissionMinutes)} Min</span>
                              )}
                            </div>
                            <span className="text-slate-200 font-light text-xs">→</span>
                            <div className="flex flex-col items-center gap-1.5 min-w-[5rem]">
                              <span className={`px-4 py-1.5 rounded-full font-black text-xs tracking-tighter w-20 text-center ${item.checkOut?.time ? 'bg-slate-50 text-slate-900 border border-slate-200' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                {item.checkOut?.time || '--:--'}
                              </span>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!item.isHoliday && item.lunch?.out ? (
                          <div className="flex items-center justify-center gap-2">
                             <Badge variant="outline" className="border-slate-200 text-slate-400 bg-slate-50 rounded-lg text-[9px] font-black px-2 gap-1 h-7 uppercase tracking-wider">
                                {item.lunch.out} - {item.lunch.in || 'PND'}
                             </Badge>
                          </div>
                        ) : (
                          <span className="text-slate-200 text-[9px] font-black uppercase tracking-widest">No Break Logged</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isHoliday ? (
                          <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[9px] uppercase shadow-none px-3 py-1 rounded-sm">On Leave</Badge>
                        ) : (
                          <div className="flex justify-center">
                            {item.checkIn?.status === 'Absent' ? (
                               <Badge className="font-black text-[9px] uppercase shadow-none bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-sm hover:bg-emerald-50">
                                 ABSENT
                               </Badge>
                            ) : item.checkIn?.time ? (
                               <Badge className="font-black text-[9px] uppercase shadow-none bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-sm hover:bg-emerald-50">
                                 VALIDATED
                               </Badge>
                            ) : (
                               <Badge className="font-black text-[9px] uppercase shadow-none bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-sm hover:bg-emerald-50">
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
                          onClick={() => {
                            setEmergencyData({
                              userId: item.user._id,
                              checkInTime: item.checkIn?.time || '',
                              checkOutTime: item.checkOut?.time || '',
                              mode: item.checkIn?.mode || 'WFO',
                              status: item.checkIn?.status || 'on-time'
                            });
                            setIsEmergencyModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
      </Card>
      
      <div className="flex justify-center pt-6 opacity-30">
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            End of Operational Cycle Signature
         </div>
      </div>

      {/* Emergency Override Modal */}
      <Dialog open={isEmergencyModalOpen} onOpenChange={setIsEmergencyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              Emergency Override
            </DialogTitle>
            <DialogDescription>
              Manually log or update attendance for {format(new Date(date), 'MMMM dd, yyyy')}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmergencySubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Name</Label>
                {emergencyData.userId && isEmergencyModalOpen ? (
                  <div className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md flex items-center">
                    <span className="font-medium text-slate-900">
                      {employees.find(e => e._id === emergencyData.userId)?.name || 'Unknown'}
                    </span>
                  </div>
                ) : (
                  <Select 
                    value={emergencyData.userId} 
                    onValueChange={(val) => setEmergencyData({ ...emergencyData, userId: val })}
                  >
                    <SelectTrigger className={emergencyData.userId ? "opacity-75" : ""}>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {employees.map(emp => (
                        <SelectItem key={emp._id} value={emp._id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <div className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md flex items-center">
                  <span className="text-sm text-slate-500 font-mono">
                    {emergencyData.userId 
                      ? (employees.find(e => e._id === emergencyData.userId)?.employeeId || 'No ID assigned')
                      : 'Select an employee first'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check In Time</Label>
                <Input 
                  type="time" 
                  value={emergencyData.checkInTime} 
                  onChange={(e) => setEmergencyData({ ...emergencyData, checkInTime: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Check Out Time (Optional)</Label>
                <Input 
                  type="time" 
                  value={emergencyData.checkOutTime} 
                  onChange={(e) => setEmergencyData({ ...emergencyData, checkOutTime: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Environment Mode</Label>
                <Select 
                  value={emergencyData.mode} 
                  onValueChange={(val) => setEmergencyData({ ...emergencyData, mode: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="WFO">WFO</SelectItem>
                    <SelectItem value="WFH">WFH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={emergencyData.status} 
                  onValueChange={(val) => setEmergencyData({ ...emergencyData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="on-time">On Time</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEmergencyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={emergencyLoading}>
                {emergencyLoading ? "Processing..." : "Submit Override"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAttendance;
