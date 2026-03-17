import { LayoutDashboard, UserCheck, CreditCard, Settings, Calendar } from "lucide-react";

export const employeeMenuItem = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', path: '/dashboard/logs', icon: UserCheck },
  { name: 'Earnings', path: '/dashboard/earnings', icon: CreditCard },
  { name: 'Leave Request', path: '/dashboard/leave', icon: Calendar },
  { name: 'Permissions', path: '/dashboard/permissions', icon: Settings },
  { name: 'Complaints', path: '/dashboard/complaints', icon: Settings }
];
