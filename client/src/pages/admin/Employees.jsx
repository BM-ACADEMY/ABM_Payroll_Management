import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Users, UserPlus, Phone, Edit, Trash2, Search } from "lucide-react";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Employee Form State
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    baseSalary: '',
    timingSettings: { loginTime: '09:30', logoutTime: '18:30', graceTime: 15, lunchStart: '13:30', lunchEnd: '14:30', fromDate: '', toDate: '' }
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Employee Form State
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '', employeeId: '', name: '', email: '', phoneNumber: '', password: '', baseSalary: '',
    timingSettings: { loginTime: '', logoutTime: '', graceTime: '', lunchStart: '', lunchEnd: '', fromDate: '', toDate: '' }
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Employee State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees`, {
        headers: { 'x-auth-token': token }
      });
      setEmployees(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch employees');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimingChange = (e) => {
    setFormData({
      ...formData,
      timingSettings: { ...formData.timingSettings, [e.target.name]: e.target.value }
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/employees`, formData, {
        headers: { 'x-auth-token': token }
      });

      // Add new employee to top of list
      setEmployees([res.data, ...employees]);
      setIsOpen(false);
      
      // Reset form
      setFormData({ 
        employeeId: '', name: '', email: '', phoneNumber: '', password: '', baseSalary: '',
        timingSettings: { loginTime: '09:30', logoutTime: '18:30', graceTime: 15, lunchStart: '13:30', lunchEnd: '14:30', fromDate: '', toDate: '' }
      });
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to create employee');
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
      password: '', // Provide blank for intentional reset
      timingSettings: {
        loginTime: emp.timingSettings?.loginTime || '09:30',
        logoutTime: emp.timingSettings?.logoutTime || '18:30',
        graceTime: emp.timingSettings?.graceTime || 15,
        lunchStart: emp.timingSettings?.lunchStart || '13:30',
        lunchEnd: emp.timingSettings?.lunchEnd || '14:30',
        fromDate: emp.timingSettings?.fromDate ? new Date(emp.timingSettings.fromDate).toISOString().split('T')[0] : '',
        toDate: emp.timingSettings?.toDate ? new Date(emp.timingSettings.toDate).toISOString().split('T')[0] : ''
      }
    });
    setEditError('');
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
    setEditError('');

    try {
      const token = localStorage.getItem('token');
      // Prune empty password so backend doesn't try to hash a blank string
      const payload = { ...editFormData };
      if (!payload.password) delete payload.password;

      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/employees/${payload.id}`, payload, {
        headers: { 'x-auth-token': token }
      });

      // Update state dynamically
      setEmployees(employees.map((emp) => emp._id === payload.id ? res.data : emp));
      setEditOpen(false);
    } catch (err) {
      setEditError(err.response?.data?.msg || 'Failed to update employee');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!employeeToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/employees/${employeeToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });

      setEmployees(employees.filter(emp => emp._id !== employeeToDelete._id));
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(err.response?.data?.msg || 'Failed to delete employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Employees Directory</h1>
          <p className="text-slate-500 text-sm md:text-base">Manage all registered staff members in your organization</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 py-6 px-6 rounded-xl font-semibold shadow-sm w-full md:w-auto">
              <UserPlus className="w-5 h-5" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Add New Employee</DialogTitle>
              <DialogDescription className="text-slate-500">
                Register a new staff member. They will be automatically verified and assigned the employee role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-slate-700">Employee ID</Label>
                  <Input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" placeholder="e.g. EMP1001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-slate-700">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Initial Password</Label>
                  <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseSalary" className="text-slate-700">Base Salary (₹)</Label>
                  <Input id="baseSalary" name="baseSalary" type="number" min="0" value={formData.baseSalary} onChange={handleChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                </div>
              </div>

              {/* Timing Settings Divider */}
              <div className="pt-4 pb-2 border-t border-slate-100">
                <h3 className="text-md font-semibold text-slate-900">Timing Configurations</h3>
                <p className="text-xs text-slate-500 mb-4">Set specific access and roster times for this employee</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate" className="text-slate-700">From Date</Label>
                    <Input id="fromDate" name="fromDate" type="date" value={formData.timingSettings.fromDate} onChange={handleTimingChange} className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate" className="text-slate-700">To Date</Label>
                    <Input id="toDate" name="toDate" type="date" value={formData.timingSettings.toDate} onChange={handleTimingChange} className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginTime" className="text-slate-700">Login Time</Label>
                    <Input id="loginTime" name="loginTime" type="time" value={formData.timingSettings.loginTime} onChange={handleTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoutTime" className="text-slate-700">Logout Time</Label>
                    <Input id="logoutTime" name="logoutTime" type="time" value={formData.timingSettings.logoutTime} onChange={handleTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graceTime" className="text-slate-700">Grace (mins)</Label>
                    <Input id="graceTime" name="graceTime" type="number" min="0" value={formData.timingSettings.graceTime} onChange={handleTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lunchStart" className="text-slate-700">Lunch In Time</Label>
                    <Input id="lunchStart" name="lunchStart" type="time" value={formData.timingSettings.lunchStart} onChange={handleTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lunchEnd" className="text-slate-700">Lunch Out Time</Label>
                    <Input id="lunchEnd" name="lunchEnd" type="time" value={formData.timingSettings.lunchEnd} onChange={handleTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                  {formLoading ? 'Creating...' : 'Create Employee'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-6 gap-6 border-b border-slate-100">
          <div className="space-y-1">
            <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Registered Employees
            </CardTitle>
            <CardDescription className="text-slate-500">Total {employees.length} continuous active members</CardDescription>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border-slate-200 pl-10 h-11 text-slate-900 focus-visible:ring-indigo-500 shadow-sm w-full" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : employees.length === 0 ? (
             <div className="text-center py-12 text-slate-500">No employees found. Add one to get started.</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">No results found for "{searchTerm}"</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="text-slate-500 font-medium px-6 whitespace-nowrap">Employee ID</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Name & Contact</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Role</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Base Salary</TableHead>
                    <TableHead className="text-slate-500 font-medium whitespace-nowrap">Email Verified</TableHead>
                    <TableHead className="text-right text-slate-500 font-medium px-6 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp._id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-indigo-600 font-medium px-6">{emp.employeeId || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-[200px]">
                          <span className="font-medium text-slate-900">{emp.name}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {emp.phoneNumber || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500">{emp.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shadow-none font-medium capitalize whitespace-nowrap">
                          {emp.role?.name || 'Employee'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600 whitespace-nowrap">₹{emp.baseSalary?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        {emp.isEmailVerified ? (
                           <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none">Verified</Badge>
                        ) : (
                           <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(emp)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteModal(emp)} className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit Employee Details</DialogTitle>
            <DialogDescription className="text-slate-500">
              Modify the profile of {editFormData.name}. Leave the password blank if you do not wish to change it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            {editError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
                {editError}
              </div>
            )}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="editEmployeeId" className="text-slate-700">Employee ID</Label>
                 <Input id="editEmployeeId" name="employeeId" value={editFormData.employeeId} onChange={handleEditChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="editName" className="text-slate-700">Full Name</Label>
                 <Input id="editName" name="name" value={editFormData.name} onChange={handleEditChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="editEmail" className="text-slate-700">Email Address</Label>
               <Input id="editEmail" name="email" type="email" value={editFormData.email} onChange={handleEditChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
             </div>
             <div className="space-y-2">
               <Label htmlFor="editPhoneNumber" className="text-slate-700">Phone Number</Label>
               <Input id="editPhoneNumber" name="phoneNumber" type="tel" value={editFormData.phoneNumber} onChange={handleEditChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="editPassword" className="text-slate-700">New Password</Label>
                 <Input id="editPassword" name="password" type="password" value={editFormData.password} onChange={handleEditChange} className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" placeholder="Leave blank to keep current" />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="editBaseSalary" className="text-slate-700">Base Salary (₹)</Label>
                 <Input id="editBaseSalary" name="baseSalary" type="number" min="0" value={editFormData.baseSalary} onChange={handleEditChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
               </div>
             </div>

             {/* Editing Timing Settings Divider */}
             <div className="pt-4 pb-2 border-t border-slate-100">
                <h3 className="text-md font-semibold text-slate-900">Timing Configurations</h3>
                <p className="text-xs text-slate-500 mb-4">Modify specific access and roster times for this employee</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFromDate" className="text-slate-700">From Date</Label>
                    <Input id="editFromDate" name="fromDate" type="date" value={editFormData.timingSettings.fromDate} onChange={handleEditTimingChange} className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editToDate" className="text-slate-700">To Date</Label>
                    <Input id="editToDate" name="toDate" type="date" value={editFormData.timingSettings.toDate} onChange={handleEditTimingChange} className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="editLoginTime" className="text-slate-700">Login Time</Label>
                    <Input id="editLoginTime" name="loginTime" type="time" value={editFormData.timingSettings.loginTime} onChange={handleEditTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLogoutTime" className="text-slate-700">Logout Time</Label>
                    <Input id="editLogoutTime" name="logoutTime" type="time" value={editFormData.timingSettings.logoutTime} onChange={handleEditTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGraceTime" className="text-slate-700">Grace (mins)</Label>
                    <Input id="editGraceTime" name="graceTime" type="number" min="0" value={editFormData.timingSettings.graceTime} onChange={handleEditTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editLunchStart" className="text-slate-700">Lunch In Time</Label>
                    <Input id="editLunchStart" name="lunchStart" type="time" value={editFormData.timingSettings.lunchStart} onChange={handleEditTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLunchEnd" className="text-slate-700">Lunch Out Time</Label>
                    <Input id="editLunchEnd" name="lunchEnd" type="time" value={editFormData.timingSettings.lunchEnd} onChange={handleEditTimingChange} required className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-indigo-500" />
                  </div>
                </div>
              </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">Cancel</Button>
              <Button type="submit" disabled={editLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Are you absolutely sure?</DialogTitle>
            <DialogDescription className="text-slate-500">
              This action cannot be undone. This will permanently delete <b>{employeeToDelete?.name}</b>'s account and remove their data from the server.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
               {deleteError}
             </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">Cancel</Button>
            <Button type="button" onClick={handleDeleteSubmit} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700 text-white font-medium">
              {deleteLoading ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
