import { LayoutDashboard, Users, UserCheck, CreditCard, Settings,FileText  } from "lucide-react";

export const adminMenuItem = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Employees', path: '/admin/employees', icon: Users },
  { name: 'Attendance', path: '/admin/attendance', icon: UserCheck },
  { name: 'Permissions', path: '/admin/permissions', icon: FileText },
  { name: 'Payroll', path: '/admin/payroll', icon: CreditCard },
  { name: 'Settings', path: '/admin/settings', icon: Settings }
];
