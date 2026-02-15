import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Cpu,
  Factory,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
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
      label: 'PCBs',
    },
    {
      path: '/production',
      icon: Factory,
      label: 'Production',
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
    },
    {
      path: '/excel',
      icon: FileSpreadsheet,
      label: 'Excel Management',
    },
    {
      path: '/procurement',
      icon: AlertTriangle,
      label: 'Procurement',
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold">INVICTUS 2025</h2>
            <p className="text-xs text-gray-400">Hackathon Project</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
