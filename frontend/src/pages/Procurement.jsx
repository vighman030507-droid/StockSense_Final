import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, XCircle, Clock, Check, X, ShieldAlert, ArrowRight, FileCheck } from 'lucide-react';

const Procurement = () => {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'resolved'
  const [resolvingTrigger, setResolvingTrigger] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  useEffect(() => {
    fetchTriggers();
  }, [filter]);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/procurement/triggers', {
        params: { status: filter },
      });
      setTriggers(response.data.data?.procurement_triggers || []);
    } catch (error) {
      toast.error('Failed to fetch procurement triggers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openResolveModal = (trigger) => {
    setResolvingTrigger(trigger);
    setResolutionNotes(`PO-${new Date().getFullYear()}-001: Order placed with vendor`);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingTrigger) return;

    try {
      setSubmittingResolve(true);
      await axiosInstance.put(`/api/production/procurement/triggers/${resolvingTrigger.id}/resolve`, {
        notes: resolutionNotes,
      });
      toast.success('Procurement trigger resolved');
      setResolvingTrigger(null);
      setResolutionNotes('');
      fetchTriggers();
    } catch (error) {
      toast.error('Failed to resolve trigger');
    } finally {
      setSubmittingResolve(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="spinner w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading procurement triggers...</p>
      </div>
    );
  }

  const pendingCount = filter === 'pending' ? triggers.length : 0;
  const resolvedCount = filter === 'resolved' ? triggers.length : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Procurement Triggers
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automated reorder triggers dispatched when stock crosses below the critical 20% monthly requirement threshold
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="card p-5 border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Action Required
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {filter === 'pending' ? triggers.length : 'Review Pending Tab'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Critical shortages needing purchase orders
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Resolved Orders
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {filter === 'resolved' ? triggers.length : 'Review History Tab'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Purchase orders processed and documented
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Data Table */}
      <div className="card p-0 overflow-hidden">
        {/* Tab Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              filter === 'pending'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Alerts</span>
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Resolved History</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {triggers.length === 0 ? (
            <div className="text-center py-16">
              {filter === 'pending' ? (
                <div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zero Pending Procurement Triggers</h4>
                  <p className="text-xs text-slate-500 mt-1">All electronic components have stock above their 20% safety threshold.</p>
                </div>
              ) : (
                <div>
                  <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-slate-500">No resolved triggers recorded</p>
                </div>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Part Number</th>
                  <th>Component Name</th>
                  <th>Current Stock</th>
                  <th>Monthly Requirement</th>
                  <th>Status</th>
                  {filter === 'resolved' && <th>Resolution Notes</th>}
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {triggers.map((trigger) => {
                  const stock = trigger.current_stock;
                  const req = trigger.monthly_requirement;
                  const pct = Math.round((stock / (req || 1)) * 100);

                  return (
                    <tr key={trigger.id} className={filter === 'pending' ? 'bg-rose-500/5 dark:bg-rose-950/20' : ''}>
                      <td className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(trigger.triggered_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {trigger.part_number}
                      </td>
                      <td className="font-semibold text-slate-900 dark:text-white">
                        {trigger.component_name}
                      </td>
                      <td>
                        <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                          {stock}
                        </span>{' '}
                        <span className="text-xs text-slate-400 font-mono">({pct}%)</span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300 font-medium">
                        {req} {trigger.unit_of_measure || 'pcs'}
                      </td>
                      <td>
                        {trigger.status === 'pending' ? (
                          <span className="badge badge-danger">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending PO
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <Check className="w-3 h-3 mr-1" />
                            Resolved
                          </span>
                        )}
                      </td>
                      {filter === 'resolved' && (
                        <td className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {trigger.notes || 'Resolved without PO notes'}
                        </td>
                      )}
                      <td className="text-right">
                        {trigger.status === 'pending' ? (
                          <button
                            onClick={() => openResolveModal(trigger)}
                            className="btn btn-success text-xs py-1.5 px-3"
                          >
                            Mark PO Placed
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {trigger.resolved_at ? new Date(trigger.resolved_at).toLocaleDateString() : 'Done'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modern Trigger Resolution Modal (Replaces crude window.prompt) */}
      {resolvingTrigger && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 mb-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Resolve Procurement Alert
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {resolvingTrigger.part_number} &bull; {resolvingTrigger.component_name}
                </p>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 mt-4">
              <div>
                <label className="form-label">Purchase Order (PO) / Resolution Notes *</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="form-input text-xs"
                  rows="3"
                  placeholder="e.g. PO-2026-9481 placed with Mouser / DigiKey. Expected delivery in 3 days."
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingTrigger(null)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolve}
                  className="btn btn-success text-xs font-semibold"
                >
                  {submittingResolve ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Procurement;
