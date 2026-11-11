import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Cpu,
  Factory,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      path: '/components',
      icon: Package,
      label: 'Components',
    },
    {
      path: '/pcbs',
      icon: Cpu,
      label: 'PCBs & BOM',
    },
    {
      path: '/production',
      icon: Factory,
      label: 'Production Run',
    },
    {
      path: '/procurement',
      icon: AlertTriangle,
      label: 'Procurement Alerts',
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics & Lots',
    },
    {
      path: '/excel',
      icon: FileSpreadsheet,
      label: 'Excel Operations',
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col min-h-screen transition-colors duration-200 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              Stock<span className="text-blue-600 dark:text-blue-400">Sense</span>
            </h2>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Inventory & BOM Engine
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-1.5 flex-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Status
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Neon PostgreSQL Active
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
