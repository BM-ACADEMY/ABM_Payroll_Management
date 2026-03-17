import { LayoutDashboard, Users, UserCheck, CreditCard, Settings, FileText, Calendar } from "lucide-react";

export const adminMenuItem = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Employees', path: '/admin/employees', icon: Users },
  { name: 'Attendance', path: '/admin/attendance', icon: UserCheck },
  { name: 'Permissions', path: '/admin/permissions', icon: FileText },
  { name: 'Leave Calendar', path: '/admin/leave-calendar', icon: Calendar },
  { name: 'Payroll', path: '/admin/payroll', icon: CreditCard },
  { name: 'Complaints', path: '/admin/complaints', icon: FileText },
  { name: 'Settings', path: '/admin/settings', icon: Settings }
];
