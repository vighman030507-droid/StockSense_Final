import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react';

const Components = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    component_name: '',
    part_number: '',
    current_stock_quantity: 0,
    monthly_required_quantity: 0,
    unit_of_measure: 'pieces',
  });

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/components');
      setComponents(response.data.data.components || []);
    } catch (error) {
      toast.error('Failed to fetch components');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingComponent) {
        await axiosInstance.put(`/api/components/${editingComponent.id}`, formData);
        toast.success('Component updated successfully');
      } else {
        await axiosInstance.post('/api/components', formData);
        toast.success('Component created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchComponents();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (component) => {
    setEditingComponent(component);
    setFormData({
      component_name: component.component_name,
      part_number: component.part_number,
      current_stock_quantity: component.current_stock_quantity,
      monthly_required_quantity: component.monthly_required_quantity,
      unit_of_measure: component.unit_of_measure,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this component?')) return;
    
    try {
      await axiosInstance.delete(`/api/components/${id}`);
      toast.success('Component deleted successfully');
      fetchComponents();
    } catch (error) {
      toast.error('Failed to delete component');
    }
  };

  const resetForm = () => {
    setFormData({
      component_name: '',
      part_number: '',
      current_stock_quantity: 0,
      monthly_required_quantity: 0,
      unit_of_measure: 'pieces',
    });
    setEditingComponent(null);
  };

  const filteredComponents = components.filter((comp) =>
    comp.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Components</h1>
          <p className="text-gray-600 mt-1">Manage your component inventory</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Component</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search components by name or part number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Components Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Component Name</th>
                <th>Current Stock</th>
                <th>Monthly Required</th>
                <th>Status</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No components found
                  </td>
                </tr>
              ) : (
                filteredComponents.map((component) => {
                  const stockPercent = (component.current_stock_quantity / component.monthly_required_quantity) * 100;
                  const isLowStock = component.is_low_stock;

                  return (
                    <tr key={component.id} className={isLowStock ? 'bg-red-50' : ''}>
                      <td className="font-mono font-semibold">
                        {component.part_number}
                      </td>
                      <td>{component.component_name}</td>
                      <td className={isLowStock ? 'text-red-600 font-bold' : 'font-semibold'}>
                        {component.current_stock_quantity}
                      </td>
                      <td>{component.monthly_required_quantity}</td>
                      <td>
                        {isLowStock ? (
                          <span className="badge badge-danger flex items-center w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </span>
                        ) : stockPercent < 50 ? (
                          <span className="badge badge-warning">Medium</span>
                        ) : (
                          <span className="badge badge-success">Good</span>
                        )}
                      </td>
                      <td>{component.unit_of_measure}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(component)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(component.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingComponent ? 'Edit Component' : 'Add Component'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Part Number *</label>
                    <input
                      type="text"
                      value={formData.part_number}
                      onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                      className="form-input"
                      required
                      disabled={!!editingComponent}
                    />
                  </div>

                  <div>
                    <label className="form-label">Unit of Measure</label>
                    <input
                      type="text"
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Component Name *</label>
                  <input
                    type="text"
                    value={formData.component_name}
                    onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Current Stock Quantity *</label>
                    <input
                      type="number"
                      value={formData.current_stock_quantity}
                      onChange={(e) => setFormData({ ...formData, current_stock_quantity: parseInt(e.target.value) })}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Monthly Required Quantity *</label>
                    <input
                      type="number"
                      value={formData.monthly_required_quantity}
                      onChange={(e) => setFormData({ ...formData, monthly_required_quantity: parseInt(e.target.value) })}
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingComponent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Components;
