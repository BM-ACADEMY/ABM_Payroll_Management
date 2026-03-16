import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, CheckCircle2, AlertCircle, PieChart, MoreHorizontal } from "lucide-react";

const AdminDashboard = () => {
  const [employees] = useState([
    { id: 'EMP001', name: 'John Doe', salary: 20000, status: 'Active', role: 'Employee' },
    { id: 'EMP002', name: 'Jane Smith', salary: 25000, status: 'Active', role: 'Sub-admin' }
  ]);

  const stats = [
    { label: 'Total Employees', value: '24', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Present Today', value: '21', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Leaves', value: '3', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Monthly Payroll', value: '₹4.2L', icon: PieChart, color: 'text-violet-600', bg: 'bg-violet-50' }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Admin Overview</h1>
          <p className="text-slate-500">Manage your workforce and payroll logistics</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 py-6 px-6 rounded-xl font-semibold">
          <UserPlus className="w-5 h-5" />
          Add Employee
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl text-slate-900">Employee Directory</CardTitle>
            <CardDescription className="text-slate-500">Total {employees.length} active members</CardDescription>
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">Filter</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium">Employee ID</TableHead>
                <TableHead className="text-slate-500 font-medium">Name</TableHead>
                <TableHead className="text-slate-500 font-medium">Role</TableHead>
                <TableHead className="text-slate-500 font-medium">Base Salary</TableHead>
                <TableHead className="text-slate-500 font-medium">Status</TableHead>
                <TableHead className="text-right text-slate-500 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, i) => (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-indigo-600">{emp.id}</TableCell>
                  <TableCell className="font-medium text-slate-900">{emp.name}</TableCell>
                  <TableCell className="text-slate-600">{emp.role}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">₹{emp.salary.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none">
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
