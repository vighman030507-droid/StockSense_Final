import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Package, Check, X, SlidersHorizontal } from 'lucide-react';

const Components = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState(null);
  const [editingComponent, setEditingComponent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'low', 'healthy'

  const [formData, setFormData] = useState({
    component_name: '',
    part_number: '',
    current_stock_quantity: 0,
    monthly_required_quantity: 1,
    unit_of_measure: 'pieces',
    description: '',
  });

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/components');
      setComponents(response.data.data?.components || []);
    } catch (error) {
      toast.error('Failed to fetch components');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      current_stock_quantity: parseInt(formData.current_stock_quantity || 0, 10),
      monthly_required_quantity: parseInt(formData.monthly_required_quantity || 1, 10),
    };

    try {
      if (editingComponent) {
        await axiosInstance.put(`/api/components/${editingComponent.id}`, payload);
        toast.success('Component updated successfully');
      } else {
        await axiosInstance.post('/api/components', payload);
        toast.success('Component registered successfully');
      }

      setShowModal(false);
      resetForm();
      fetchComponents();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (component) => {
    setEditingComponent(component);
    setFormData({
      component_name: component.component_name || '',
      part_number: component.part_number || '',
      current_stock_quantity: component.current_stock_quantity ?? 0,
      monthly_required_quantity: component.monthly_required_quantity ?? 1,
      unit_of_measure: component.unit_of_measure || 'pieces',
      description: component.description || '',
    });
    setShowModal(true);
  };

  const confirmDelete = (component) => {
    setComponentToDelete(component);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!componentToDelete) return;

    try {
      await axiosInstance.delete(`/api/components/${componentToDelete.id}`);
      toast.success('Component deleted successfully');
      setShowDeleteModal(false);
      setComponentToDelete(null);
      fetchComponents();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to delete component';
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setFormData({
      component_name: '',
      part_number: '',
      current_stock_quantity: 0,
      monthly_required_quantity: 1,
      unit_of_measure: 'pieces',
      description: '',
    });
    setEditingComponent(null);
  };

  const filteredComponents = components.filter((comp) => {
    const matchesSearch =
      comp.component_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.part_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const stockRatio = (comp.current_stock_quantity / (comp.monthly_required_quantity || 1)) * 100;
    const isLow = comp.is_low_stock || stockRatio <= 20;

    if (!matchesSearch) return false;
    if (filterType === 'low') return isLow;
    if (filterType === 'healthy') return !isLow;
    return true;
  });

  const lowStockCount = components.filter(
    (c) => c.is_low_stock || (c.current_stock_quantity / (c.monthly_required_quantity || 1)) * 100 <= 20
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="spinner w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading components catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Component Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, configure, and monitor electronic stock levels and monthly consumption requirements
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Component</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search components by part code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input !pl-10 pr-9 text-sm"
              style={{ paddingLeft: '2.5rem' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({components.length})
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filterType === 'low'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Low Stock ({lowStockCount})</span>
            </button>
            <button
              onClick={() => setFilterType('healthy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'healthy'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Healthy ({components.length - lowStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Components Table Card */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Component Name</th>
                <th>Current Stock</th>
                <th>Monthly Requirement</th>
                <th>Stock Ratio</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Package className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No components match your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search filters or add a new component</p>
                  </td>
                </tr>
              ) : (
                filteredComponents.map((component) => {
                  const req = component.monthly_required_quantity || 1;
                  const stock = component.current_stock_quantity || 0;
                  const ratio = Math.round((stock / req) * 100);
                  const isLow = component.is_low_stock || ratio <= 20;

                  return (
                    <tr key={component.id} className={isLow ? 'bg-rose-500/5 dark:bg-rose-950/20' : ''}>
                      <td className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {component.part_number}
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {component.component_name}
                        </div>
                        {component.description && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                            {component.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`font-extrabold text-sm ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {stock.toLocaleString()}
                        </span>{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          {component.unit_of_measure || 'pcs'}
                        </span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300 font-medium">
                        {req.toLocaleString()} {component.unit_of_measure || 'pcs'}
                      </td>
                      <td className="w-40">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow
                                  ? 'bg-rose-500'
                                  : ratio < 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(ratio, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono font-bold w-10 text-right">
                            {ratio}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-danger">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </span>
                        ) : ratio < 50 ? (
                          <span className="badge badge-warning">Medium</span>
                        ) : (
                          <span className="badge badge-success">Sufficient</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleEdit(component)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Component"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(component)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Component"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Component Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingComponent ? 'Edit Component Record' : 'Register New Component'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter component specifications and replenishment thresholds
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Part Number / SKU *</label>
                  <input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                    className="form-input font-mono text-xs uppercase"
                    placeholder="e.g. CAP-10UF-001"
                    required
                    disabled={!!editingComponent}
                  />
                  {editingComponent && (
                    <span className="text-[10px] text-slate-400 mt-1 block">Part numbers cannot be changed</span>
                  )}
                </div>

                <div>
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                    className="form-input text-xs"
                    placeholder="pieces, reels, meters..."
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Component Name *</label>
                <input
                  type="text"
                  value={formData.component_name}
                  onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
                  className="form-input text-sm"
                  placeholder="e.g. Ceramic Capacitor 10uF 50V"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Current Stock Quantity *</label>
                  <input
                    type="number"
                    value={formData.current_stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_stock_quantity: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="form-input text-sm font-semibold"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Monthly Required Quantity *</label>
                  <input
                    type="number"
                    value={formData.monthly_required_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthly_required_quantity: e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="form-input text-sm font-semibold"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description / Notes (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input text-xs"
                  rows="2"
                  placeholder="Package size, tolerance, manufacturer..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  {editingComponent ? 'Update Component' : 'Create Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && componentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Component</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900 dark:text-white">{componentToDelete.component_name}</strong> (
              <span className="font-mono">{componentToDelete.part_number}</span>)?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Note: Components referenced in PCB Bill of Materials or historical logs cannot be deleted.
            </p>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setComponentToDelete(null);
                }}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger text-xs">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Components;
