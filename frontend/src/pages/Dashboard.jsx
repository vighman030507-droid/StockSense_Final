import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Package, Cpu, AlertTriangle, Factory, TrendingUp, TrendingDown } from 'lucide-react';
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

      // Fetch components
      const componentsRes = await axiosInstance.get('/api/components');
      const components = componentsRes.data.data.components || [];

      // Fetch PCBs
      const pcbsRes = await axiosInstance.get('/api/pcbs');
      const pcbs = pcbsRes.data.data.pcbs || [];

      // Fetch low stock
      const lowStockRes = await axiosInstance.get('/api/components/low-stock');
      const lowStock = lowStockRes.data.data.low_stock_components || [];

      // Fetch recent production
      const productionRes = await axiosInstance.get('/api/production?limit=5');
      const production = productionRes.data.data.production_entries || [];

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
      <div className="flex items-center justify-center h-96">
        <div className="spinner w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Components',
      value: stats.totalComponents,
      icon: Package,
      color: 'blue',
      trend: null,
    },
    {
      title: 'Total PCBs',
      value: stats.totalPCBs,
      icon: Cpu,
      color: 'green',
      trend: null,
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? 'red' : 'gray',
      trend: stats.lowStockCount > 0 ? 'down' : null,
    },
    {
      title: 'Production Entries',
      value: stats.recentProduction.length,
      icon: Factory,
      color: 'purple',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to PCB Inventory Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            red: 'bg-red-500',
            purple: 'bg-purple-500',
            gray: 'bg-gray-500',
          };

          return (
            <div key={index} className="card animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                    {stat.trend === 'up' && (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                    {stat.trend === 'down' && (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-full ${colorClasses[stat.color]}`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Production */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Production Entries</h2>

        {stats.recentProduction.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No production entries yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PCB</th>
                  <th>Quantity</th>
                  <th>Lot Number</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProduction.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-mono">#{entry.id}</td>
                    <td>{entry.pcb_name || 'Component String'}</td>
                    <td>{entry.quantity_produced}</td>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {entry.lot_number}
                      </code>
                    </td>
                    <td className="text-gray-600">
                      {new Date(entry.production_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-2">Need to add components?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage your component inventory quickly
          </p>
          <a href="/components" className="btn btn-primary">
            Go to Components
          </a>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <h3 className="font-bold text-gray-900 mb-2">Record production?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Log new production entries with automatic stock deduction
          </p>
          <a href="/production" className="btn btn-success">
            Create Production
          </a>
        </div>

        <div className="card bg-purple-50 border-2 border-purple-200">
          <h3 className="font-bold text-gray-900 mb-2">View analytics?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get insights into consumption and trends
          </p>
          <a href="/analytics" className="btn" style={{ background: '#9333ea', color: 'white' }}>
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
