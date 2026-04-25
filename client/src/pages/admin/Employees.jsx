import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, Eye, Phone, Edit, Trash2, Search, Check, Shield, ShieldCheck, Lock, Mail, CreditCard, Clock, Calendar, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaginationControl from '@/components/ui/PaginationControl';
import { hasPermission } from '@/utils/permissionUtils';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/ui/Loader';

const MODULES = [
  { id: 'employees', label: 'Employees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'teams', label: 'Teams' },
  { id: 'credits', label: 'Weekly Credits' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'kanban', label: 'Kanban Boards' },
  { id: 'settings', label: 'Settings' },
  { id: 'time_history', label: 'Time History' }
];

const ACTIONS = [
  { id: 'read', label: 'View' },
  { id: 'create', label: 'Add' },
  { id: 'update', label: 'Edit' },
  { id: 'delete', label: 'Delete' }
];

const Employees = () => {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  
  // Add Employee Form State
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    baseSalary: '',
    dob: '',
    qualification: '',
    experienceYears: '',
    designation: '',
    joiningDate: '',
    timingSettings: { loginTime: '09:30', logoutTime: '18:30', graceTime: 15, lunchStart: '13:30', lunchEnd: '14:30', fromDate: '', toDate: '' },
    teams: [],
    role: 'employee',
    permissions: []
  });
  const [formLoading, setFormLoading] = useState(false);

  // Edit Employee Form State
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '', employeeId: '', name: '', email: '', phoneNumber: '', password: '', baseSalary: '',
    dob: '', qualification: '', experienceYears: '', designation: '', joiningDate: '',
    timingSettings: { loginTime: '', logoutTime: '', graceTime: '', lunchStart: '', lunchEnd: '', fromDate: '', toDate: '' },
    teams: [],
    role: '',
    permissions: []
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Employee State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View Employee State
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  const fetchEmployees = async (page = 1) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?page=${page}&limit=10&name=${searchTerm}`, {
        headers: { 'x-auth-token': token }
      });
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch employees",
      });
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchEmployees(page);
  };

  const fetchTeams = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/teams`, {
        headers: { 'x-auth-token': token }
      });
      setTeams(res.data.teams);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimingChange = (e) => {
    setFormData({
      ...formData,
      timingSettings: { ...formData.timingSettings, [e.target.name]: e.target.value }
    });
  };

  const toggleTeam = (teamId, isEdit = false) => {
    if (isEdit) {
      const newTeams = editFormData.teams.includes(teamId)
        ? editFormData.teams.filter(id => id !== teamId)
        : [...editFormData.teams, teamId];
      setEditFormData({ ...editFormData, teams: newTeams });
    } else {
      const newTeams = formData.teams.includes(teamId)
        ? formData.teams.filter(id => id !== teamId)
        : [...formData.teams, teamId];
      setFormData({ ...formData, teams: newTeams });
    }
  };

  const togglePermission = (moduleId, actionId, isEdit = false) => {
    const permString = `${moduleId}:${actionId}`;
    if (isEdit) {
      const newPerms = editFormData.permissions.includes(permString)
        ? editFormData.permissions.filter(p => p !== permString)
        : [...editFormData.permissions, permString];
      setEditFormData({ ...editFormData, permissions: newPerms });
    } else {
      const newPerms = formData.permissions.includes(permString)
        ? formData.permissions.filter(p => p !== permString)
        : [...formData.permissions, permString];
      setFormData({ ...formData, permissions: newPerms });
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/employees`, formData, {
        headers: { 'x-auth-token': token }
      });

      setEmployees([res.data, ...employees]);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      
      setFormData({ 
        employeeId: '', name: '', email: '', phoneNumber: '', password: '', baseSalary: '',
        dob: '', qualification: '', experienceYears: '', designation: '', joiningDate: '',
        timingSettings: { loginTime: '09:30', logoutTime: '18:30', graceTime: 15, lunchStart: '13:30', lunchEnd: '14:30', fromDate: '', toDate: '' },
        teams: [],
        role: 'employee',
        permissions: []
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to create employee",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (emp) => {
    setEditFormData({
      id: emp._id,
      employeeId: emp.employeeId || '',
      name: emp.name || '',
      email: emp.email || '',
      phoneNumber: emp.phoneNumber || '',
      baseSalary: emp.baseSalary || '',
      password: '',
      timingSettings: {
        loginTime: emp.timingSettings?.loginTime || '09:30',
        logoutTime: emp.timingSettings?.logoutTime || '18:30',
        graceTime: emp.timingSettings?.graceTime || 15,
        lunchStart: emp.timingSettings?.lunchStart || '13:30',
        lunchEnd: emp.timingSettings?.lunchEnd || '14:30',
        fromDate: emp.timingSettings?.fromDate ? new Date(emp.timingSettings.fromDate).toISOString().split('T')[0] : '',
        toDate: emp.timingSettings?.toDate ? new Date(emp.timingSettings.toDate).toISOString().split('T')[0] : ''
      },
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      qualification: emp.qualification || '',
      experienceYears: emp.experienceYears || '',
      designation: emp.designation || '',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      teams: emp.teams?.map(t => typeof t === 'object' ? t._id : t) || [],
      role: emp.role?.name || 'employee',
      permissions: emp.permissions || []
    });
    setEditOpen(true);
  };

  const openViewModal = (emp) => {
    setViewEmployee(emp);
    setViewOpen(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditTimingChange = (e) => {
    setEditFormData({
      ...editFormData,
      timingSettings: { ...editFormData.timingSettings, [e.target.name]: e.target.value }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const payload = { ...editFormData };
      if (!payload.password) delete payload.password;

      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/employees/${payload.id}`, payload, {
        headers: { 'x-auth-token': token }
      });

      setEmployees(employees.map((emp) => emp._id === payload.id ? res.data : emp));
      setEditOpen(false);
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to update employee",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!employeeToDelete) return;
    setDeleteLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/employees/${employeeToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });

      setEmployees(employees.filter(emp => emp._id !== employeeToDelete._id));
      setDeleteOpen(false);
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.msg || "Failed to delete employee",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500 bg-gray-50/20 min-h-screen pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-gray-900">
            Employee <span className="text-[#d30614]">Management</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-normal max-w-2xl">
            Control personnel records, manage teams, and configure operational permissions
          </p>
        </div>
        
        {hasPermission(currentUser, 'employees:create') && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#d30614] hover:bg-gray-900 text-white rounded-xl h-14 px-8 font-bold shadow-lg transition-all hover:-translate-y-1 active:scale-95">
                <UserPlus className="w-5 h-5 mr-2" /> Add New Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-0 border-none shadow-2xl">
              <div className="bg-gray-900 p-8 md:p-10 text-white">
                 <DialogTitle className="text-2xl font-bold tracking-tight">Register Employee</DialogTitle>
                 <DialogDescription className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Setup a new professional profile in the system</DialogDescription>
              </div>
              <form onSubmit={handleAddEmployee} className="p-8 md:p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Employee ID</Label>
                       <Input name="employeeId" value={formData.employeeId} onChange={handleChange} required placeholder="e.g., EMP101" className="h-12 border-gray-100 rounded-xl focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</Label>
                       <Input name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className="h-12 border-gray-100 rounded-xl focus:bg-white" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</Label>
                       <Input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" className="h-12 border-gray-100 rounded-xl focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</Label>
                       <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="+91 XXXX" className="h-12 border-gray-100 rounded-xl focus:bg-white" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">DOB</Label>
                       <Input name="dob" type="date" value={formData.dob} onChange={handleChange} className="h-12 border-gray-100 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Qualification</Label>
                       <Input name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. B.Tech" className="h-12 border-gray-100 rounded-xl" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Experience (Years)</Label>
                       <Input name="experienceYears" type="number" value={formData.experienceYears} onChange={handleChange} className="h-12 border-gray-100 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Designation</Label>
                       <Input name="designation" value={formData.designation} onChange={handleChange} placeholder="Software Engineer" className="h-12 border-gray-100 rounded-xl" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Joining Date</Label>
                       <Input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} className="h-12 border-gray-100 rounded-xl" />
                    </div>
                 </div>
                 {/* Password and Salary fields follow */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</Label>
                       <Input name="password" type="password" value={formData.password} onChange={handleChange} required className="h-12 border-gray-100 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Base Salary</Label>
                       <Input name="baseSalary" type="number" value={formData.baseSalary} onChange={handleChange} required className="h-12 border-gray-100 rounded-xl" />
                    </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] text-gray-400">Cancel</Button>
                    <Button type="submit" disabled={formLoading} className="bg-gray-900 hover:bg-[#d30614] text-white rounded-xl h-12 px-8 font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg">
                       {formLoading ? 'Processing...' : 'Create Employee'}
                    </Button>
                 </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {/* Main Content Card */}
      <Card className="border-gray-100 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#d30614]" /> Employee Registry
            </CardTitle>
            <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-wider">{pagination.total} total staff members registered</CardDescription>
          </div>
          
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-gray-50 border-gray-100 rounded-xl focus:bg-white text-sm" 
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="py-32 flex flex-col items-center gap-4">
               <Loader size="lg" color="red" />
               <span className="text-xs font-medium text-gray-400">Synchronizing database...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-32 text-center text-gray-400 px-6">
              No employees found match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="pl-8 h-14 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Employee</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Contact</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Role & Teams</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Salary</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Status</TableHead>
                    <TableHead className="pr-8 h-14 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp._id} className="hover:bg-gray-50/30 transition-all border-gray-50">
                      <TableCell className="pl-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-[#fffe01] font-bold text-lg uppercase">
                               {emp.name?.charAt(0)}
                            </div>
                            <div className="flex flex-col leading-tight">
                               <span className="font-bold text-gray-900">{emp.name}</span>
                               <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">{emp.employeeId || 'N/A'}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs space-y-0.5">
                          <span className="font-medium text-gray-600 flex items-center gap-1.5"><Mail className="w-3 h-3 truncate" /> {emp.email}</span>
                          <span className="text-gray-400 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {emp.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                           <Badge variant="outline" className="bg-white border-gray-200 text-gray-600 text-[9px] font-bold uppercase w-fit">
                             {emp.role?.name?.toUpperCase() || 'STAFF'}
                           </Badge>
                           <div className="flex flex-wrap gap-1">
                              {emp.teams?.map((team, idx) => (
                                <span key={idx} className="text-[8px] font-bold px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded">
                                  {typeof team === 'object' ? team.name : 'Unknown'}
                                </span>
                              ))}
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <span className="font-bold text-gray-900">₹{emp.baseSalary?.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center">
                         {emp.isEmailVerified ? (
                           <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px] uppercase">Verified</Badge>
                         ) : (
                           <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[9px] uppercase">Pending</Badge>
                         )}
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                         <div className="flex justify-end gap-1">
                            <Button onClick={() => openViewModal(emp)} variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {hasPermission(currentUser, 'employees:update') && (
                              <Button onClick={() => openEditModal(emp)} variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {hasPermission(currentUser, 'employees:delete') && (
                              <Button onClick={() => openDeleteModal(emp)} variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                         </div>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-0 border-none shadow-2xl">
          <div className="bg-gray-900 p-8 md:p-12 text-white">
             <DialogTitle className="text-2xl font-bold tracking-tight">Edit Profile: {editFormData.name}</DialogTitle>
             <DialogDescription className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Update employee account settings and permissions</DialogDescription>
          </div>
          <form onSubmit={handleEditSubmit} className="p-8 md:p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Employee ID</Label>
                  <Input name="employeeId" value={editFormData.employeeId} onChange={handleEditChange} required className="h-12 border-gray-200 rounded-xl focus:bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</Label>
                  <Input name="name" value={editFormData.name} onChange={handleEditChange} required className="h-12 border-gray-200 rounded-xl focus:bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</Label>
                  <Input name="email" type="email" value={editFormData.email} onChange={handleEditChange} required className="h-12 border-gray-200 rounded-xl focus:bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</Label>
                  <Input name="phoneNumber" value={editFormData.phoneNumber} onChange={handleEditChange} required className="h-12 border-gray-200 rounded-xl focus:bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">DOB</Label>
                  <Input name="dob" type="date" value={editFormData.dob} onChange={handleEditChange} className="h-12 border-gray-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Qualification</Label>
                  <Input name="qualification" value={editFormData.qualification} onChange={handleEditChange} className="h-12 border-gray-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Experience</Label>
                  <Input name="experienceYears" type="number" value={editFormData.experienceYears} onChange={handleEditChange} className="h-12 border-gray-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Designation</Label>
                  <Input name="designation" value={editFormData.designation} onChange={handleEditChange} className="h-12 border-gray-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Joining Date</Label>
                  <Input name="joiningDate" type="date" value={editFormData.joiningDate} onChange={handleEditChange} className="h-12 border-gray-200 rounded-xl" />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Users className="w-3.5 h-3.5" /> Assigned Teams
                </Label>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  {teams.map(team => (
                    <Badge
                      key={team._id}
                      variant={editFormData.teams.includes(team._id) ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all ${editFormData.teams.includes(team._id) ? 'bg-gray-200 border-gray-900' : 'bg-white border-gray-200 text-gray-400'}`}
                      onClick={() => toggleTeam(team._id, true)}
                    >
                      {team.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Shield className="w-3.5 h-3.5" /> System Role
                  </Label>
                  <select 
                    name="role" 
                    value={editFormData.role} 
                    onChange={handleEditChange}
                    className="w-full h-12 border border-gray-200 bg-gray-50 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none appearance-none"
                  >
                    <option value="employee">Standard Employee</option>
                    <option value="subadmin">Manager (Sub-Admin)</option>
                  </select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Base Salary
                   </Label>
                   <Input name="baseSalary" type="number" value={editFormData.baseSalary} onChange={handleEditChange} required className="h-12 border-gray-200 rounded-xl text-emerald-600 font-bold" />
                </div>
              </div>

              {editFormData.role === 'subadmin' && (
                <div className="space-y-6 p-6 md:p-8 bg-gray-900 rounded-[2rem] text-white">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#fffe01]" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Management Permissions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs uppercase tracking-widest">
                      <thead>
                        <tr className="border-b border-white/5 opacity-40">
                          <th className="pb-4 font-bold text-[9px]">Module</th>
                          {ACTIONS.map(a => (
                            <th key={a.id} className="pb-4 font-bold text-[9px] text-center">{a.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {MODULES.map(m => (
                          <tr key={m.id}>
                            <td className="py-4 text-white/60 font-bold text-[9px]">{m.label}</td>
                            {ACTIONS.map(a => (
                              <td key={a.id} className="py-4 text-center">
                                <input 
                                  type="checkbox"
                                  checked={editFormData.permissions.includes(`${m.id}:${a.id}`)}
                                  onChange={() => togglePermission(m.id, a.id, true)}
                                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#d30614] focus:ring-0 checked:bg-[#d30614]"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-8 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-3">
                   <Clock className="w-5 h-5 text-gray-400" />
                   <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Schedule & Timing</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From Date</Label>
                    <Input name="fromDate" type="date" value={editFormData.timingSettings.fromDate} onChange={handleEditTimingChange} className="h-11 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To Date</Label>
                    <Input name="toDate" type="date" value={editFormData.timingSettings.toDate} onChange={handleEditTimingChange} className="h-11 rounded-xl bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login Time</Label>
                    <Input name="loginTime" type="time" value={editFormData.timingSettings.loginTime} onChange={handleEditTimingChange} required className="h-11 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logout Time</Label>
                    <Input name="logoutTime" type="time" value={editFormData.timingSettings.logoutTime} onChange={handleEditTimingChange} required className="h-11 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grace (Mins)</Label>
                    <Input name="graceTime" type="number" min="0" value={editFormData.timingSettings.graceTime} onChange={handleEditTimingChange} required className="h-11 rounded-xl bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lunch Break Start</Label>
                    <Input name="lunchStart" type="time" value={editFormData.timingSettings.lunchStart} onChange={handleEditTimingChange} required className="h-11 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lunch Break End</Label>
                    <Input name="lunchEnd" type="time" value={editFormData.timingSettings.lunchEnd} onChange={handleEditTimingChange} required className="h-11 rounded-xl bg-white" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-gray-50">
                <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] text-gray-400">Cancel</Button>
                <Button type="submit" disabled={editLoading} className="bg-gray-900 hover:bg-[#d30614] text-white rounded-xl h-14 px-10 font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl">
                  {editLoading ? 'Syncing...' : 'Save Changes'}
                </Button>
              </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-0 border-none shadow-2xl">
          <div className="bg-gray-900 p-8 md:p-12 text-white sticky top-0 z-10 flex justify-between items-center">
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight">{viewEmployee?.name}</DialogTitle>
              <DialogDescription className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Complete Personnel Operational File</DialogDescription>
            </div>
            <Badge className="bg-[#fffe01] text-black hover:bg-[#fffe01] font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl">
              {viewEmployee?.role?.name || 'Staff'}
            </Badge>
          </div>
          
          <div className="p-8 md:p-12 space-y-12">
            {/* Identity & Contact Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border-4 border-gray-100 flex items-center justify-center text-5xl font-black text-gray-900 shadow-inner">
                  {viewEmployee?.name?.charAt(0)}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Registry ID</p>
                  <p className="font-bold text-gray-900">{viewEmployee?.employeeId || 'NOT ASSIGNED'}</p>
                </div>
              </div>
              
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Email Address</p>
                  <p className="text-lg font-bold text-gray-900 break-all">{viewEmployee?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Phone Coordinate</p>
                  <p className="text-lg font-bold text-gray-900">{viewEmployee?.phoneNumber}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Designation</p>
                  <p className="text-lg font-bold text-gray-900 uppercase tracking-wider">{viewEmployee?.designation || 'Operational Staff'}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">System Status</p>
                  <Badge className={`${viewEmployee?.isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} border-none font-bold uppercase tracking-widest text-[9px]`}>
                    {viewEmployee?.isEmailVerified ? 'Security Verified' : 'Vetting Pending'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gray-50 rounded-3xl space-y-2">
                <p className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Base Compensation</p>
                <p className="text-2xl font-black text-emerald-600">₹{viewEmployee?.baseSalary?.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-2">
                <p className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Activation Date</p>
                <p className="text-xl font-bold text-gray-900">{viewEmployee?.joiningDate ? new Date(viewEmployee.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT RECORDED'}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-2">
                <p className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Experience Ledger</p>
                <p className="text-xl font-bold text-gray-900">{viewEmployee?.experienceYears || 0} Professional Years</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#d30614]" />
                  <h3 className="font-black uppercase tracking-widest text-xs text-gray-900">Personal Background</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</span>
                    <span className="font-bold text-gray-900">{viewEmployee?.dob ? new Date(viewEmployee.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qualification</span>
                    <span className="font-bold text-gray-900 uppercase">{viewEmployee?.qualification || 'Not Specified'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#d30614]" />
                  <h3 className="font-black uppercase tracking-widest text-xs text-gray-900">Team Assignments</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {viewEmployee?.teams?.length > 0 ? (
                    viewEmployee.teams.map((team, idx) => (
                      <Badge key={idx} className="bg-gray-900 text-white font-bold uppercase tracking-widest text-[9px] px-4 py-1.5 rounded-lg border-none shadow-md">
                        {typeof team === 'object' ? team.name : 'Unknown Team'}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs font-medium italic">No active team assignments found.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-gray-50 flex justify-end">
               <Button onClick={() => setViewOpen(false)} className="bg-gray-900 hover:bg-[#d30614] text-white rounded-2xl h-14 px-12 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl">
                 Secure File
               </Button>
            </div>
          </div>
        </DialogContent>
       </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-10 border-none shadow-2xl text-center">
           <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
           </div>
           <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">Delete Employee Account?</DialogTitle>
           <DialogDescription className="text-gray-500 mt-4 text-sm leading-relaxed">
             This will permanently remove <span className="font-bold text-gray-900">{employeeToDelete?.name}</span> from the system. This action is irreversible.
           </DialogDescription>
           
           <div className="grid grid-cols-2 gap-4 mt-10">
             <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} className="h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] text-gray-400 border-gray-100 hover:bg-gray-50">Cancel</Button>
             <Button type="button" onClick={handleDeleteSubmit} disabled={deleteLoading} className="h-12 rounded-xl bg-red-600 hover:bg-gray-900 text-white font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95">
               {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
             </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
