import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Package, Cpu, AlertTriangle, Factory, ArrowUpRight, TrendingUp, TrendingDown, Layers, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalComponents: 0,
    totalPCBs: 0,
    lowStockCount: 0,
    recentProduction: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [componentsRes, pcbsRes, lowStockRes, productionRes] = await Promise.all([
        axiosInstance.get('/api/components'),
        axiosInstance.get('/api/pcbs'),
        axiosInstance.get('/api/components/low-stock'),
        axiosInstance.get('/api/production?limit=5'),
      ]);

      const components = componentsRes.data.data?.components || [];
      const pcbs = pcbsRes.data.data?.pcbs || [];
      const lowStock = lowStockRes.data.data?.low_stock_components || [];
      const production = productionRes.data.data?.production_entries || [];

      setStats({
        totalComponents: components.length,
        totalPCBs: pcbs.length,
        lowStockCount: lowStock.length,
        recentProduction: production,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="spinner w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading operations console...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Components',
      value: stats.totalComponents,
      subtitle: 'Managed inventory parts',
      icon: Package,
      gradient: 'from-blue-600 to-cyan-600',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20',
      link: '/components',
    },
    {
      title: 'Configured PCBs',
      value: stats.totalPCBs,
      subtitle: 'Bill of Materials registered',
      icon: Cpu,
      gradient: 'from-indigo-600 to-purple-600',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20',
      link: '/pcbs',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount,
      subtitle: stats.lowStockCount > 0 ? 'Requires procurement' : 'Healthy inventory level',
      icon: AlertTriangle,
      gradient: stats.lowStockCount > 0 ? 'from-amber-600 to-rose-600' : 'from-slate-600 to-slate-700',
      iconBg: stats.lowStockCount > 0 
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20' 
        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20',
      link: '/procurement',
      alert: stats.lowStockCount > 0,
    },
    {
      title: 'Recent Production Runs',
      value: stats.recentProduction.length,
      subtitle: 'Latest logged production batches',
      icon: Factory,
      gradient: 'from-emerald-600 to-teal-600',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20',
      link: '/production',
    },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time PCB inventory telemetry, BOM consumption, and automated replenishment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/production" className="btn btn-primary shadow-sm shadow-blue-500/20">
            <Factory className="w-4 h-4 mr-2" />
            <span>New Production Run</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="card p-5 group hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {stat.value}
                    </span>
                    {stat.alert && (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center">
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                        Action
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Production Table Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Production Batches
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest PCB lots completed with stock deducted
              </p>
            </div>
          </div>
          <Link
            to="/production"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <span>View All Runs</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {stats.recentProduction.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Factory className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No production entries logged yet</p>
            <p className="text-xs text-slate-400 mt-1">Start by recording your first PCB run to see consumption metrics</p>
            <Link to="/production" className="btn btn-secondary text-xs mt-4">
              Log Production
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Target Assembly</th>
                  <th>Units Produced</th>
                  <th>Lot Code</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProduction.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{entry.id}
                    </td>
                    <td className="font-medium">
                      {entry.pcb_name ? (
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-slate-400" />
                          <span>{entry.pcb_name}</span>
                          {entry.pcb_code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {entry.pcb_code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono">
                          Component String Run
                        </span>
                      )}
                    </td>
                    <td className="font-bold text-slate-900 dark:text-slate-100">
                      {entry.quantity_produced} <span className="text-xs font-normal text-slate-400">units</span>
                    </td>
                    <td>
                      <code className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {entry.lot_number || 'N/A'}
                      </code>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(entry.production_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 bg-gradient-to-br from-blue-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border-blue-200/80 dark:border-blue-900/40">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            Component Inventory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Register new electronic components, calibrate monthly requirements, and adjust stock.
          </p>
          <Link to="/components" className="btn btn-secondary w-full text-xs font-semibold">
            Manage Components →
          </Link>
        </div>

        <div className="card p-5 bg-gradient-to-br from-indigo-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border-indigo-200/80 dark:border-indigo-900/40">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            PCB Bill of Materials
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Configure PCB definitions and associate exact component quantities per board.
          </p>
          <Link to="/pcbs" className="btn btn-secondary w-full text-xs font-semibold">
            Configure PCBs →
          </Link>
        </div>

        <div className="card p-5 bg-gradient-to-br from-purple-50/60 to-white dark:from-slate-900 dark:to-slate-900/90 border-purple-200/80 dark:border-purple-900/40">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
            Consumption Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Inspect lot-level consumption traces, efficiency ratios, and component usage trends.
          </p>
          <Link to="/analytics" className="btn btn-secondary w-full text-xs font-semibold">
            View Analytics →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
