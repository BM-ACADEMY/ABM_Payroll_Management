import { LayoutDashboard, UserCheck, CreditCard, Settings } from "lucide-react";

export const employeeMenuItem = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', path: '/dashboard/logs', icon: UserCheck },
  { name: 'Earnings', path: '/dashboard/earnings', icon: CreditCard },
  { name: 'Permissions', path: '/dashboard/permissions', icon: Settings }
];
