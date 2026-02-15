import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const Procurement = () => {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'resolved'

  useEffect(() => {
    fetchTriggers();
  }, [filter]);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/procurement/triggers', {
        params: { status: filter },
      });
      setTriggers(response.data.data.procurement_triggers || []);
    } catch (error) {
      toast.error('Failed to fetch procurement triggers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (triggerId) => {
    const notes = prompt('Enter resolution notes (e.g., Purchase Order number):');
    if (!notes) return;

    try {
      await axiosInstance.put(`/api/production/procurement/triggers/${triggerId}/resolve`, {
        notes,
      });
      toast.success('Trigger marked as resolved');
      fetchTriggers();
    } catch (error) {
      toast.error('Failed to resolve trigger');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const pendingCount = triggers.filter(t => t.status === 'pending').length;
  const resolvedCount = triggers.filter(t => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Procurement Triggers</h1>
        <p className="text-gray-600 mt-1">Manage low stock alerts and procurement orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-red-500 rounded-full">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Triggers</p>
              <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-green-500 rounded-full">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved Triggers</p>
              <p className="text-3xl font-bold text-gray-900">{resolvedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Successfully handled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex space-x-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Triggers Table */}
        <div className="mt-4 overflow-x-auto">
          {triggers.length === 0 ? (
            <div className="text-center py-12">
              {filter === 'pending' ? (
                <div>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No pending procurement triggers!</p>
                  <p className="text-sm text-gray-400 mt-1">All components are adequately stocked</p>
                </div>
              ) : (
                <div>
                  <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No resolved triggers yet</p>
                </div>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Triggered At</th>
                  <th>Component</th>
                  <th>Part Number</th>
                  <th>Current Stock</th>
                  <th>Monthly Req.</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  {filter === 'pending' && <th>Actions</th>}
                  {filter === 'resolved' && <th>Resolved At</th>}
                </tr>
              </thead>
              <tbody>
                {triggers.map((trigger) => {
                  const stockPercent = (trigger.current_stock / trigger.monthly_requirement) * 100;
                  
                  return (
                    <tr key={trigger.id} className={filter === 'pending' ? 'bg-red-50' : 'bg-green-50'}>
                      <td className="text-sm text-gray-600">
                        {new Date(trigger.triggered_at).toLocaleString()}
                      </td>
                      <td className="font-medium">{trigger.component_name}</td>
                      <td className="font-mono">{trigger.part_number}</td>
                      <td className="font-bold text-red-600">{trigger.current_stock}</td>
                      <td>{trigger.monthly_requirement}</td>
                      <td>
                        <span className="badge badge-warning">
                          {trigger.threshold_percentage}%
                        </span>
                      </td>
                      <td>
                        {trigger.status === 'pending' ? (
                          <span className="badge badge-danger flex items-center w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        ) : (
                          <span className="badge badge-success flex items-center w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </span>
                        )}
                      </td>
                      {filter === 'pending' && (
                        <td>
                          <button
                            onClick={() => handleResolve(trigger.id)}
                            className="btn btn-success btn-sm"
                          >
                            Mark Resolved
                          </button>
                        </td>
                      )}
                      {filter === 'resolved' && trigger.resolved_at && (
                        <td className="text-sm text-gray-600">
                          {new Date(trigger.resolved_at).toLocaleString()}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 border-2 border-blue-200">
        <h3 className="font-bold text-gray-900 mb-3">About Procurement Triggers</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            • Triggers are <strong>automatically generated</strong> when component stock falls below 20% of monthly requirement
          </p>
          <p>
            • Each component can only have <strong>one pending trigger</strong> at a time
          </p>
          <p>
            • Mark triggers as resolved after placing purchase orders
          </p>
          <p>
            • New triggers will be generated if stock continues to decrease
          </p>
        </div>
      </div>
    </div>
  );
};

export default Procurement;
