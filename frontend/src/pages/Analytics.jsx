import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, AlertTriangle, Package, Activity, Calendar, Filter } from 'lucide-react';

const Analytics = () => {
  const [topConsumed, setTopConsumed] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const { isDark } = useTheme();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const params = {};
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }

      const [topConsumedRes, lowStockRes, efficiencyRes] = await Promise.all([
        axiosInstance.get('/api/analytics/top-consumed', { params: { limit: 10, ...params } }),
        axiosInstance.get('/api/analytics/low-stock'),
        axiosInstance.get('/api/analytics/production-efficiency', { params }),
      ]);

      setTopConsumed(topConsumedRes.data.data || []);
      setLowStock(lowStockRes.data.data || []);
      setEfficiencyData(efficiencyRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchAnalytics();
  };

  const clearFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTimeout(fetchAnalytics, 50);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="spinner w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Computing analytics metrics...</p>
      </div>
    );
  }

  // Theme-aware colors for Recharts
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Telemetry & Consumption Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical Bill of Materials usage, component demand distribution, and production batch efficiency
        </p>
      </div>

      {/* Date Filter Card */}
      <div className="card p-5">
        <div className="flex items-center space-x-2.5 mb-3 text-slate-900 dark:text-white font-bold text-sm">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Timeline Filter</span>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3.5">
          <div className="flex-1 w-full">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="form-input text-xs"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="form-input text-xs"
            />
          </div>
          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
            <button onClick={handleDateFilter} className="btn btn-primary text-xs flex-1 sm:flex-none">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span>Apply Range</span>
            </button>
            <button onClick={clearFilter} className="btn btn-secondary text-xs flex-1 sm:flex-none">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card p-5 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top Consumed Parts
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {topConsumed.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Low Stock Threshold
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {lowStock.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Efficiency Periods
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {efficiencyData.length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Top Consumed Components Bar Chart Card */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span>Top 10 Consumed Electronic Components</span>
        </h2>

        {topConsumed.length === 0 ? (
          <div className="text-center py-14 text-slate-400 text-xs">
            No consumption records found for the selected timeframe.
          </div>
        ) : (
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsumed} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="component_code"
                  stroke={textColor}
                  fontSize={11}
                  angle={-30}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-blue-400">{d.component_name}</p>
                          <p className="font-mono text-slate-300">SKU: {d.component_code}</p>
                          <p>
                            Total Consumed: <strong className="text-emerald-400">{d.total_consumed} units</strong>
                          </p>
                          <p className="text-slate-400">Current Stock: {d.current_stock}</p>
                          <p className="text-slate-400">Avg / Production: {d.avg_per_consumption}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total_consumed" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Units Consumed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Production Efficiency & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Production Efficiency Table */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Production Runs Efficiency</span>
          </h2>

          {efficiencyData.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">No production batch data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Runs</th>
                    <th>PCB Models</th>
                    <th>Total Units</th>
                    <th>Avg / Run</th>
                  </tr>
                </thead>
                <tbody>
                  {efficiencyData.map((item, index) => (
                    <tr key={index}>
                      <td className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{item.period}</td>
                      <td>{item.production_runs}</td>
                      <td>{item.unique_pcb_types}</td>
                      <td className="font-bold text-slate-900 dark:text-white">{item.total_produced}</td>
                      <td className="text-slate-500 font-mono text-xs">{item.avg_produced_per_run}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Component Distribution Pie Chart */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-500" />
            <span>Top Component Consumption Share</span>
          </h2>

          {topConsumed.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">No distribution data available</p>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topConsumed.slice(0, 6)}
                    dataKey="total_consumed"
                    nameKey="component_code"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {topConsumed.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                            <span className="font-bold text-blue-400">{d.component_code}</span>: {d.total_consumed} units
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
