import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Users, UserPlus, Phone, Edit, Trash2, Search, Check, Shield, ShieldCheck, Lock, Unlock } from "lucide-react";
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
    fetchEmployees(1);
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
      teams: emp.teams?.map(t => typeof t === 'object' ? t._id : t) || [],
      role: emp.role?.name || 'employee',
      permissions: emp.permissions || []
    });
    setEditOpen(true);
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

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-[#d30614] rounded-full"></div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900">
              Employees <span className="text-[#d30614]">Directory</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm md:text-base font-normal">Manage all registered staff members in your organization</p>
        </div>
        
        {hasPermission(currentUser, 'employees:create') && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#d30614] hover:bg-red-700 text-white flex items-center justify-center gap-2 py-7 px-8 rounded-2xl font-medium shadow-lg shadow-red-600/10 w-full md:w-auto hover:scale-[1.02] transition-all">
                <UserPlus className="w-5 h-5" />
                Add New Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border-gray-200 p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Add New Employee</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Register a new staff member. They will be automatically verified and assigned the employee role.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-gray-700">Employee ID</Label>
                    <Input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" placeholder="e.g. EMP1001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-700">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                </div>
  
                <div className="space-y-2">
                  <Label className="text-gray-700">Assign Teams</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {teams.map(team => (
                      <Badge
                        key={team._id}
                        variant={formData.teams.includes(team._id) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${formData.teams.includes(team._id) ? 'bg-black text-white hover:bg-zinc-800' : 'hover:bg-gray-100 text-gray-600'}`}
                        onClick={() => toggleTeam(team._id)}
                      >
                        {formData.teams.includes(team._id) && <Check className="w-3 h-3 mr-1" />}
                        {team.name}
                      </Badge>
                    ))}
                    {teams.length === 0 && <p className="text-xs text-gray-400">No teams found. Create teams in Team Management first.</p>}
                  </div>
                </div>
  
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Account Role</Label>
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-2 focus:ring-2 focus:ring-[#d30614] outline-none"
                    >
                      <option value="employee">Employee (Regular Access)</option>
                      <option value="subadmin">Sub-Admin (Management Access)</option>
                    </select>
                  </div>
                </div>
  
                {formData.role === 'subadmin' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-[#d30614]" />
                      <h3 className="font-medium text-gray-900">Sub-Admin Permissions</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr>
                            <th className="pb-2 font-medium text-gray-500">Module</th>
                            {ACTIONS.map(a => (
                              <th key={a.id} className="pb-2 font-medium text-gray-500 text-center">{a.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {MODULES.map(m => (
                            <tr key={m.id}>
                              <td className="py-2 text-gray-700 font-medium">{m.label}</td>
                              {ACTIONS.map(a => (
                                <td key={a.id} className="py-2 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={formData.permissions.includes(`${m.id}:${a.id}`)}
                                    onChange={() => togglePermission(m.id, a.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#d30614] focus:ring-[#d30614]"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-gray-400">Note: Red checkboxes indicate granted permissions.</p>
                  </div>
                )}
  
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" title="password required" className="text-gray-700">Initial Password</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseSalary" className="text-gray-700">Base Salary (₹)</Label>
                    <Input id="baseSalary" name="baseSalary" type="number" min="0" value={formData.baseSalary} onChange={handleChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                </div>
  
                <div className="pt-4 pb-2 border-t border-gray-100">
                  <h3 className="text-md font-medium text-gray-900">Timing Configurations</h3>
                  <p className="text-xs text-gray-500 mb-4">Set specific access and roster times for this employee</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromDate" className="text-gray-700">From Date</Label>
                      <Input id="fromDate" name="fromDate" type="date" value={formData.timingSettings.fromDate} onChange={handleTimingChange} className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toDate" className="text-gray-700">To Date</Label>
                      <Input id="toDate" name="toDate" type="date" value={formData.timingSettings.toDate} onChange={handleTimingChange} className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                  </div>
  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginTime" className="text-gray-700">Login Time</Label>
                      <Input id="loginTime" name="loginTime" type="time" value={formData.timingSettings.loginTime} onChange={handleTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoutTime" className="text-gray-700">Logout Time</Label>
                      <Input id="logoutTime" name="logoutTime" type="time" value={formData.timingSettings.logoutTime} onChange={handleTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graceTime" className="text-gray-700">Grace (mins)</Label>
                      <Input id="graceTime" name="graceTime" type="number" min="0" value={formData.timingSettings.graceTime} onChange={handleTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                  </div>
  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lunchStart" className="text-gray-700">Lunch In Time</Label>
                      <Input id="lunchStart" name="lunchStart" type="time" value={formData.timingSettings.lunchStart} onChange={handleTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lunchEnd" className="text-gray-700">Lunch Out Time</Label>
                      <Input id="lunchEnd" name="lunchEnd" type="time" value={formData.timingSettings.lunchEnd} onChange={handleTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                    </div>
                  </div>
                </div>
  
                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 w-full sm:w-auto">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={formLoading} className="bg-[#d30614] hover:bg-red-700 text-white w-full sm:w-auto font-medium">
                    {formLoading ? 'Creating...' : 'Create Employee'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-6 gap-6 border-b border-gray-100">
          <div className="space-y-1">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-black" />
              Registered Employees
            </CardTitle>
            <CardDescription className="text-gray-500">Total {employees.length} continuous active members</CardDescription>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border-gray-200 pl-10 h-11 text-gray-900 focus-visible:ring-[#d30614] shadow-sm w-full" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12">
              <Loader size="md" color="red" />
            </div>
          ) : employees.length === 0 ? (
             <div className="text-center py-12 text-gray-500">No employees found. Add one to get started.</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-normal">No results found for "{searchTerm}"</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-gray-500 font-medium px-6 whitespace-nowrap">Employee ID</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Name & Contact</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Role & Team</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Base Salary</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Email Verified</TableHead>
                    <TableHead className="text-right text-gray-500 font-medium px-6 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp._id} className="border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <TableCell className="font-mono text-black font-normal px-6">{emp.employeeId || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-[200px]">
                          <span className="font-normal text-gray-900">{emp.name}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {emp.phoneNumber || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-400">{emp.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 shadow-none font-normal capitalize whitespace-nowrap w-fit">
                            {emp.role?.name || 'Employee'}
                          </Badge>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {emp.teams?.map((team, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] py-1 px-2 font-normal bg-zinc-100 text-zinc-600 border-zinc-200 uppercase rounded-md">
                                {typeof team === 'object' && team.name ? team.name : 'Unknown Team'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600 whitespace-nowrap">₹{emp.baseSalary?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        {emp.isEmailVerified ? (
                           <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 shadow-none">Verified</Badge>
                        ) : (
                           <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200 shadow-none">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          {hasPermission(currentUser, 'employees:update') && (
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(emp)} className="text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {hasPermission(currentUser, 'employees:delete') && (
                            <Button variant="ghost" size="icon" onClick={() => openDeleteModal(emp)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
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
        <div className="px-6 border-t border-gray-100 bg-gray-50/10">
          <PaginationControl 
            pagination={pagination} 
            onPageChange={handlePageChange} 
          />
        </div>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Employee Details</DialogTitle>
            <DialogDescription className="text-gray-500">
              Modify the profile of {editFormData.name}. Leave the password blank if you do not wish to change it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editEmployeeId" className="text-gray-700">Employee ID</Label>
                  <Input id="editEmployeeId" name="employeeId" value={editFormData.employeeId} onChange={handleEditChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editName" className="text-gray-700">Full Name</Label>
                  <Input id="editName" name="name" value={editFormData.name} onChange={handleEditChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail" className="text-gray-700">Email Address</Label>
                <Input id="editEmail" name="email" type="email" value={editFormData.email} onChange={handleEditChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhoneNumber" className="text-gray-700">Phone Number</Label>
                <Input id="editPhoneNumber" name="phoneNumber" type="tel" value={editFormData.phoneNumber} onChange={handleEditChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Assign Teams</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {teams.map(team => (
                    <Badge
                      key={team._id}
                      variant={editFormData.teams.includes(team._id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${editFormData.teams.includes(team._id) ? 'bg-black text-white hover:bg-zinc-800' : 'hover:bg-gray-100 text-gray-600'}`}
                      onClick={() => toggleTeam(team._id, true)}
                    >
                      {editFormData.teams.includes(team._id) && <Check className="w-3 h-3 mr-1" />}
                      {team.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Account Role</Label>
                  <select 
                    name="role" 
                    value={editFormData.role} 
                    onChange={handleEditChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-2 focus:ring-2 focus:ring-[#d30614] outline-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="subadmin">Sub-Admin</option>
                  </select>
                </div>
              </div>

              {editFormData.role === 'subadmin' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-[#d30614]" />
                    <h3 className="font-medium text-gray-900">Sub-Admin Permissions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>
                          <th className="pb-2 font-medium text-gray-500">Module</th>
                          {ACTIONS.map(a => (
                            <th key={a.id} className="pb-2 font-medium text-gray-500 text-center">{a.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {MODULES.map(m => (
                          <tr key={m.id}>
                            <td className="py-2 text-gray-700 font-medium">{m.label}</td>
                            {ACTIONS.map(a => (
                              <td key={a.id} className="py-2 text-center">
                                <input 
                                  type="checkbox"
                                  checked={editFormData.permissions.includes(`${m.id}:${a.id}`)}
                                  onChange={() => togglePermission(m.id, a.id, true)}
                                  className="w-4 h-4 rounded border-gray-300 text-[#d30614] focus:ring-[#d30614]"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPassword" title="password optional" className="text-gray-700">New Password</Label>
                  <Input id="editPassword" name="password" type="password" value={editFormData.password} onChange={handleEditChange} className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" placeholder="Leave blank to keep current" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editBaseSalary" className="text-gray-700">Base Salary (₹)</Label>
                  <Input id="editBaseSalary" name="baseSalary" type="number" min="0" value={editFormData.baseSalary} onChange={handleEditChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                </div>
              </div>

              <div className="pt-4 pb-2 border-t border-gray-100">
                <h3 className="text-md font-medium text-gray-900">Timing Configurations</h3>
                <p className="text-xs text-gray-500 mb-4">Modify specific access and roster times for this employee</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFromDate" className="text-gray-700">From Date</Label>
                    <Input id="editFromDate" name="fromDate" type="date" value={editFormData.timingSettings.fromDate} onChange={handleEditTimingChange} className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editToDate" className="text-gray-700">To Date</Label>
                    <Input id="editToDate" name="toDate" type="date" value={editFormData.timingSettings.toDate} onChange={handleEditTimingChange} className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="editLoginTime" className="text-gray-700">Login Time</Label>
                    <Input id="editLoginTime" name="loginTime" type="time" value={editFormData.timingSettings.loginTime} onChange={handleEditTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLogoutTime" className="text-gray-700">Logout Time</Label>
                    <Input id="editLogoutTime" name="logoutTime" type="time" value={editFormData.timingSettings.logoutTime} onChange={handleEditTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGraceTime" className="text-gray-700">Grace (mins)</Label>
                    <Input id="editGraceTime" name="graceTime" type="number" min="0" value={editFormData.timingSettings.graceTime} onChange={handleEditTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editLunchStart" className="text-gray-700">Lunch In Time</Label>
                    <Input id="editLunchStart" name="lunchStart" type="time" value={editFormData.timingSettings.lunchStart} onChange={handleEditTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLunchEnd" className="text-gray-700">Lunch Out Time</Label>
                    <Input id="editLunchEnd" name="lunchEnd" type="time" value={editFormData.timingSettings.lunchEnd} onChange={handleEditTimingChange} required className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-[#d30614]" />
                  </div>
                </div>
              </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50">Cancel</Button>
              <Button type="submit" disabled={editLoading} className="bg-[#d30614] hover:bg-red-700 text-white font-medium">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Are you absolutely sure?</DialogTitle>
            <DialogDescription className="text-gray-500">
              This action cannot be undone. This will permanently delete <b>{employeeToDelete?.name}</b>'s account and remove their data from the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} className="border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50">Cancel</Button>
            <Button type="button" onClick={handleDeleteSubmit} disabled={deleteLoading} className="bg-rose-600 hover:bg-rose-700 text-white font-medium">
              {deleteLoading ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;

