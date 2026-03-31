import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users2, 
  UserPlus, 
  UserCheck2, 
  CalendarClock, 
  PieChart as PieChartIcon, 
  MoreHorizontal,
  ShieldAlert,
  TrendingUp
} from "lucide-react";
import { lazy, Suspense } from 'react';
import axios from 'axios';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      const [statsRes, employeesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/employees?limit=5&fields=employeeId,name,role,baseSalary`, config)
      ]);

      setStats(statsRes.data.stats || []);
      setChartData(statsRes.data.chartData || []);
      setEmployees(Array.isArray(employeesRes.data.employees) ? employeesRes.data.employees : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Fallback or error state
      setLoading(false);
    }
  };

  const IconMap = {
    Users: Users2,
    CheckCircle2: UserCheck2,
    AlertCircle: CalendarClock,
    Clock: ShieldAlert
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d30614]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-700 bg-background min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-2 bg-[#d30614] rounded-full"></div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900">Admin <span className="text-black">Overview</span></h1>
          </div>
          <p className="text-gray-500 text-lg font-normal">Comprehensive <span className="text-gray-900 font-medium">organizational overview</span> and real-time operational metrics.</p>
        </div>
        <Button className="bg-[#d30614] hover:bg-red-700 text-white flex items-center gap-2 py-7 px-8 rounded-2xl font-medium shadow-lg shadow-red-600/10 hover:scale-[1.02] transition-all">
          <UserPlus className="w-5 h-5" />
          Add New Employee
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => {
          const Icon = IconMap[stat.icon] || Users;
          return (
            <Card key={i} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-normal text-gray-500">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-medium text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Chart */}
        <Card className="bg-white border-gray-200 shadow-sm lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#d30614]" />
              <CardTitle className="text-xl text-gray-900">Today's Attendance</CardTitle>
            </div>
            <CardDescription>Real-time status of all employees</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-500">Loading chart...</div>}>
              <DashboardCharts chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card className="bg-white border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl text-gray-900">Employee Directory</CardTitle>
              <CardDescription className="text-gray-500">Total {employees.length} active members</CardDescription>
            </div>
            <Button variant="outline" className="border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50 w-full sm:w-auto">Filter</Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Employee ID</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Name</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Role</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap">Base Salary</TableHead>
                    <TableHead className="text-gray-500 font-medium whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.slice(0, 5).map((emp, i) => (
                    <TableRow key={i} className="border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <TableCell className="font-mono text-black">{emp.employeeId}</TableCell>
                      <TableCell className="font-normal text-gray-900 whitespace-nowrap">{emp.name}</TableCell>
                      <TableCell className="text-gray-500 capitalize">{emp.role?.name || 'Employee'}</TableCell>
                      <TableCell className="font-medium text-emerald-600 whitespace-nowrap">₹{emp.baseSalary?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#d30614] hover:bg-red-50">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
