import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Cpu } from 'lucide-react';

const PCBs = () => {
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedPCB, setSelectedPCB] = useState(null);
  const [editingPCB, setEditingPCB] = useState(null);

  const [formData, setFormData] = useState({
    pcb_name: '',
    pcb_code: '',
    description: '',
  });

  const [mappingForm, setMappingForm] = useState({
    component_id: '',
    quantity_per_pcb: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pcbsRes, componentsRes] = await Promise.all([
        axiosInstance.get('/api/pcbs'),
        axiosInstance.get('/api/components'),
      ]);

      setPcbs(pcbsRes.data.data.pcbs || []);
      setComponents(componentsRes.data.data.components || []);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPCB = async (e) => {
    e.preventDefault();

    try {
      if (editingPCB) {
        await axiosInstance.put(`/api/pcbs/${editingPCB.id}`, formData);
        toast.success('PCB updated successfully');
      } else {
        await axiosInstance.post('/api/pcbs', formData);
        toast.success('PCB created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const handleAddMapping = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post(`/api/pcbs/${selectedPCB.id}/components`, mappingForm);
      toast.success('Component added to PCB');
      setShowMappingModal(false);
      setMappingForm({ component_id: '', quantity_per_pcb: 1 });
      fetchPCBDetails(selectedPCB.id);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add component';
      toast.error(errorMessage);
    }
  };

  const handleRemoveMapping = async (mappingId) => {
    if (!confirm('Remove this component from PCB?')) return;

    try {
      await axiosInstance.delete(`/api/pcbs/mappings/${mappingId}`);
      toast.success('Component removed from PCB');
      fetchPCBDetails(selectedPCB.id);
    } catch (error) {
      toast.error('Failed to remove component');
    }
  };

  const fetchPCBDetails = async (pcbId) => {
    try {
      const response = await axiosInstance.get(`/api/pcbs/${pcbId}`);
      setSelectedPCB(response.data.data.pcb);
    } catch (error) {
      toast.error('Failed to fetch PCB details');
    }
  };

  const handleEdit = (pcb) => {
    setEditingPCB(pcb);
    setFormData({
      pcb_name: pcb.pcb_name,
      pcb_code: pcb.pcb_code,
      description: pcb.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this PCB? This cannot be undone.')) return;

    try {
      await axiosInstance.delete(`/api/pcbs/${id}`);
      toast.success('PCB deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete PCB');
    }
  };

  const resetForm = () => {
    setFormData({
      pcb_name: '',
      pcb_code: '',
      description: '',
    });
    setEditingPCB(null);
  };

  const viewPCBDetails = async (pcb) => {
    await fetchPCBDetails(pcb.id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PCB Management</h1>
          <p className="text-gray-600 mt-1">Configure PCBs and component mappings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add PCB</span>
        </button>
      </div>

      {/* PCBs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pcbs.length === 0 ? (
          <div className="col-span-full text-center py-12 card">
            <Cpu className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No PCBs configured yet</p>
          </div>
        ) : (
          pcbs.map((pcb) => (
            <div key={pcb.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewPCBDetails(pcb)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Cpu className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{pcb.pcb_name}</h3>
                    <p className="text-sm text-gray-600">{pcb.pcb_code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(pcb); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(pcb.id); }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {pcb.description && (
                <p className="text-sm text-gray-600 mb-3">{pcb.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {pcb.components_count || 0} components mapped
                </span>
                <button className="text-xs text-blue-600 font-medium">
                  View Details →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PCB Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingPCB ? 'Edit PCB' : 'Add PCB'}
              </h2>

              <form onSubmit={handleSubmitPCB} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">PCB Code *</label>
                    <input
                      type="text"
                      value={formData.pcb_code}
                      onChange={(e) => setFormData({ ...formData, pcb_code: e.target.value })}
                      className="form-input"
                      required
                      disabled={!!editingPCB}
                    />
                  </div>

                  <div>
                    <label className="form-label">PCB Name *</label>
                    <input
                      type="text"
                      value={formData.pcb_name}
                      onChange={(e) => setFormData({ ...formData, pcb_name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input"
                    rows="3"
                  ></textarea>
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
                    {editingPCB ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PCB Details Modal */}
      {selectedPCB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPCB.pcb_name}</h2>
                  <p className="text-gray-600">{selectedPCB.pcb_code}</p>
                </div>
                <button
                  onClick={() => setSelectedPCB(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => setShowMappingModal(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Component</span>
                </button>
              </div>

              {/* Component Mapping Table */}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Part Number</th>
                      <th>Component Name</th>
                      <th>Quantity per PCB</th>
                      <th>Current Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPCB.components?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">
                          No components mapped
                        </td>
                      </tr>
                    ) : (
                      selectedPCB.components?.map((comp) => (
                        <tr key={comp.mapping_id}>
                          <td className="font-mono">{comp.part_number}</td>
                          <td>{comp.component_name}</td>
                          <td className="font-bold">{comp.quantity_per_pcb}</td>
                          <td className={comp.current_stock_quantity < comp.quantity_per_pcb ? 'text-red-600 font-bold' : ''}>
                            {comp.current_stock_quantity}
                          </td>
                          <td>
                            <button
                              onClick={() => handleRemoveMapping(comp.mapping_id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Component Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Component to PCB</h3>

              <form onSubmit={handleAddMapping} className="space-y-4">
                <div>
                  <label className="form-label">Select Component *</label>
                  <select
                    value={mappingForm.component_id}
                    onChange={(e) => setMappingForm({ ...mappingForm, component_id: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">Choose a component...</option>
                    {components.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.part_number} - {comp.component_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Quantity per PCB *</label>
                  <input
                    type="number"
                    value={mappingForm.quantity_per_pcb}
                    onChange={(e) => setMappingForm({ ...mappingForm, quantity_per_pcb: parseInt(e.target.value) })}
                    className="form-input"
                    min="1"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMappingModal(false);
                      setMappingForm({ component_id: '', quantity_per_pcb: 1 });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add
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

export default PCBs;
