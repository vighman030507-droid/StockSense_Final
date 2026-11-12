import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Package } from 'lucide-react';

const Analytics = () => {
  const [topConsumed, setTopConsumed] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

      console.log('Low Stock API Response:', lowStockRes.data);
      console.log('Low Stock Data:', lowStockRes.data.data);
      console.log('Low Stock Count:', lowStockRes.data.data?.length);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Component consumption and production insights</p>
      </div>

      {/* Date Filter */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Date Range Filter</h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="flex-1">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="form-input"
            />
          </div>
          <button onClick={handleDateFilter} className="btn btn-primary">
            Apply Filter
          </button>
          <button
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' });
              setTimeout(fetchAnalytics, 100);
            }}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Components Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{topConsumed.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{lowStock.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Production Runs</p>
              <p className="text-2xl font-bold text-gray-900">{efficiencyData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Consumed Components Chart */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Consumed Components</h2>

        {topConsumed.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No consumption data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topConsumed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="component_code"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-bold">{data.component_name}</p>
                        <p className="text-sm text-gray-600">Code: {data.component_code}</p>
                        <p className="text-sm">Total Consumed: <strong>{data.total_consumed}</strong></p>
                        <p className="text-sm">Current Stock: {data.current_stock}</p>
                        <p className="text-sm">Avg per Use: {data.avg_per_consumption}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="total_consumed" fill="#3b82f6" name="Total Consumed" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Low Stock Components Table */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Low Stock Components</h2>

        {lowStock.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500">All components are adequately stocked!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Component Name</th>
                  <th>Current Stock</th>
                  <th>Monthly Required</th>
                  <th>Stock %</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.component_id} className="bg-red-50">
                    <td className="font-mono font-bold">{item.component_code}</td>
                    <td>{item.component_name}</td>
                    <td className="text-red-600 font-bold">{item.current_stock}</td>
                    <td>{item.monthly_required_quantity}</td>
                    <td>
                      <span className="badge badge-danger">
                        {item.stock_percentage ? item.stock_percentage : 0}%
                      </span>
                    </td>
                    <td className="text-red-600 font-bold">
                      {item.shortage_quantity > 0 ? item.shortage_quantity : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Production Efficiency */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Production Efficiency</h2>

        {efficiencyData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No production data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Production Runs</th>
                  <th>Unique PCB Types</th>
                  <th>Total Produced</th>
                  <th>Avg per Run</th>
                </tr>
              </thead>
              <tbody>
                {efficiencyData.map((item, index) => (
                  <tr key={index}>
                    <td className="font-mono">{item.period}</td>
                    <td>{item.production_runs}</td>
                    <td>{item.unique_pcb_types}</td>
                    <td className="font-bold">{item.total_produced}</td>
                    <td>{item.avg_produced_per_run}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Component Distribution Pie Chart */}
      {topConsumed.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Consumption Distribution (Top 6)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={topConsumed.slice(0, 6)}
                dataKey="total_consumed"
                nameKey="component_code"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.component_code}: ${entry.total_consumed}`}
              >
                {topConsumed.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Analytics;
