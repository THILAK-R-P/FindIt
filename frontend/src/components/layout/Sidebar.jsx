import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  Search,
  Package,
  Bell,
  User,
  ShieldCheck,
  PackageSearch,
  Users,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isAdminMode = false }) => {
  const { user, isAdmin } = useAuth();

  const userNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/report-lost', label: 'Report Lost Item', icon: AlertCircle, color: 'text-rose-500' },
    { to: '/report-found', label: 'Report Found Item', icon: CheckCircle2, color: 'text-emerald-500' },
    { to: '/items', label: 'Browse Items', icon: Search },
    { to: '/my-reports', label: 'My Reports', icon: Package },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/items', label: 'Item Management', icon: PackageSearch },
    { to: '/admin/claims', label: 'Claims Verification', icon: ShieldCheck },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/dashboard', label: 'Student Portal', icon: ArrowLeft },
  ];

  const navItems = isAdminMode ? adminNavItems : userNavItems;

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 transition-colors">
      {/* Sidebar Top User Card */}
      <div className="p-3.5 mb-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm uppercase flex-shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="truncate">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {user?.name}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
            {user?.role} • {user?.studentId}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isAdminMode ? 'Administration' : 'Menu Navigation'}
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm border border-indigo-200/60 dark:border-indigo-800/60'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className={`w-4 h-4 ${item.color || 'currentColor'}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Future AI status mini pill */}
      <div className="mt-8 p-3 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/40 text-white space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Engine Prep</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-tight">
          Phase 2 will activate Gemini 2.5 Flash & FAISS index.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
