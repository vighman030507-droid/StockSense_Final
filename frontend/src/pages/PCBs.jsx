import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Cpu, Package, Layers, X, AlertTriangle, ArrowRight, Check } from 'lucide-react';

const PCBs = () => {
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pcbToDelete, setPcbToDelete] = useState(null);
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

      setPcbs(pcbsRes.data.data?.pcbs || []);
      setComponents(componentsRes.data.data?.components || []);
    } catch (error) {
      toast.error('Failed to fetch PCB data');
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
        toast.success('PCB configuration updated');
      } else {
        await axiosInstance.post('/api/pcbs', formData);
        toast.success('New PCB registered');
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
      await axiosInstance.post(`/api/pcbs/${selectedPCB.id}/components`, {
        component_id: parseInt(mappingForm.component_id, 10),
        quantity_per_pcb: parseInt(mappingForm.quantity_per_pcb, 10) || 1,
      });
      toast.success('Component mapped to PCB');
      setShowMappingModal(false);
      setMappingForm({ component_id: '', quantity_per_pcb: 1 });
      fetchPCBDetails(selectedPCB.id);
      fetchData(); // update counter on cards
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add component mapping';
      toast.error(errorMessage);
    }
  };

  const handleRemoveMapping = async (mappingId) => {
    try {
      await axiosInstance.delete(`/api/pcbs/mappings/${mappingId}`);
      toast.success('Component removed from PCB BOM');
      fetchPCBDetails(selectedPCB.id);
      fetchData();
    } catch (error) {
      toast.error('Failed to remove component mapping');
    }
  };

  const fetchPCBDetails = async (pcbId) => {
    try {
      const response = await axiosInstance.get(`/api/pcbs/${pcbId}`);
      setSelectedPCB(response.data.data?.pcb);
    } catch (error) {
      toast.error('Failed to fetch PCB BOM details');
    }
  };

  const handleEdit = (pcb) => {
    setEditingPCB(pcb);
    setFormData({
      pcb_name: pcb.pcb_name || '',
      pcb_code: pcb.pcb_code || '',
      description: pcb.description || '',
    });
    setShowModal(true);
  };

  const confirmDeletePCB = (pcb) => {
    setPcbToDelete(pcb);
    setShowDeleteModal(true);
  };

  const handleDeletePCB = async () => {
    if (!pcbToDelete) return;

    try {
      await axiosInstance.delete(`/api/pcbs/${pcbToDelete.id}`);
      toast.success('PCB deleted successfully');
      setShowDeleteModal(false);
      setPcbToDelete(null);
      if (selectedPCB?.id === pcbToDelete.id) {
        setSelectedPCB(null);
      }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="spinner w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full"></div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading PCB assemblies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            PCB Assemblies & BOM
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure printed circuit boards and define their associated Bill of Materials (BOM)
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
          <span>Register New PCB</span>
        </button>
      </div>

      {/* PCBs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pcbs.length === 0 ? (
          <div className="col-span-full card p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
            <Cpu className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No PCBs Registered</h3>
            <p className="text-xs text-slate-500 mt-1">Create your first PCB configuration to start mapping components</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn btn-secondary text-xs mt-4"
            >
              Add First PCB
            </button>
          </div>
        ) : (
          pcbs.map((pcb) => (
            <div
              key={pcb.id}
              onClick={() => fetchPCBDetails(pcb.id)}
              className="card p-5 group hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20 group-hover:scale-105 transition-transform">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {pcb.pcb_name}
                      </h3>
                      <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {pcb.pcb_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(pcb)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit PCB"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDeletePCB(pcb)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete PCB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {pcb.description || 'No additional technical description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  {pcb.components_count || 0} BOM Parts
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center group-hover:translate-x-0.5 transition-transform">
                  View BOM →
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PCB Register/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingPCB ? 'Edit PCB Configuration' : 'Register New PCB'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define board identifier and specifications
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPCB} className="space-y-4 pt-4">
              <div>
                <label className="form-label">PCB Code / Model Identifier *</label>
                <input
                  type="text"
                  value={formData.pcb_code}
                  onChange={(e) => setFormData({ ...formData, pcb_code: e.target.value })}
                  className="form-input font-mono text-xs uppercase"
                  placeholder="e.g. PCB-PWR-001"
                  required
                  disabled={!!editingPCB}
                />
                {editingPCB && (
                  <span className="text-[10px] text-slate-400 mt-1 block">Board codes are immutable</span>
                )}
              </div>

              <div>
                <label className="form-label">PCB Name *</label>
                <input
                  type="text"
                  value={formData.pcb_name}
                  onChange={(e) => setFormData({ ...formData, pcb_name: e.target.value })}
                  className="form-input text-sm"
                  placeholder="e.g. 5V Regulated Power Supply Board"
                  required
                />
              </div>

              <div>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input text-xs"
                  rows="3"
                  placeholder="Layer count, revision, application notes..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  {editingPCB ? 'Update PCB' : 'Save PCB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PCB Bill of Materials (BOM) Detail Modal */}
      {selectedPCB && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedPCB.pcb_name}
                  </h2>
                  <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {selectedPCB.pcb_code} &bull; Bill of Materials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPCB(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Mapped Components ({selectedPCB.components?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-400">
                    These quantities are automatically deducted per finished board
                  </p>
                </div>
                <button
                  onClick={() => setShowMappingModal(true)}
                  className="btn btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  <span>Map Component</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Part Number</th>
                      <th>Component Name</th>
                      <th>Qty per PCB</th>
                      <th>Current Inventory</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedPCB.components || selectedPCB.components.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-xs text-slate-400">
                          No components are currently mapped to this PCB Bill of Materials.
                        </td>
                      </tr>
                    ) : (
                      selectedPCB.components.map((comp) => {
                        const hasShortage = (comp.current_stock_quantity || 0) < comp.quantity_per_pcb;
                        return (
                          <tr key={comp.mapping_id}>
                            <td className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              {comp.part_number}
                            </td>
                            <td className="font-semibold text-slate-800 dark:text-slate-200">
                              {comp.component_name}
                            </td>
                            <td>
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {comp.quantity_per_pcb}
                              </span>{' '}
                              <span className="text-xs text-slate-400">{comp.unit_of_measure || 'pcs'}</span>
                            </td>
                            <td>
                              <span
                                className={`font-semibold text-xs ${
                                  hasShortage ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {comp.current_stock_quantity} available
                              </span>
                            </td>
                            <td className="text-right">
                              <button
                                onClick={() => handleRemoveMapping(comp.mapping_id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Unmap from BOM"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPCB(null)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Component to BOM Modal */}
      {showMappingModal && selectedPCB && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Map Component to {selectedPCB.pcb_name}
              </h3>
              <button
                onClick={() => setShowMappingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMapping} className="space-y-4 pt-4">
              <div>
                <label className="form-label">Select Component *</label>
                <select
                  value={mappingForm.component_id}
                  onChange={(e) => setMappingForm({ ...mappingForm, component_id: e.target.value })}
                  className="form-input text-xs"
                  required
                >
                  <option value="">Choose an inventory component...</option>
                  {components.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.part_number} &bull; {comp.component_name} (Stock: {comp.current_stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Quantity Required Per PCB *</label>
                <input
                  type="number"
                  value={mappingForm.quantity_per_pcb}
                  onChange={(e) =>
                    setMappingForm({
                      ...mappingForm,
                      quantity_per_pcb: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="form-input text-sm font-semibold"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMappingModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Add to BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && pcbToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete PCB</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900 dark:text-white">{pcbToDelete.pcb_name}</strong> (
              <span className="font-mono">{pcbToDelete.pcb_code}</span>)?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Note: PCBs with historical production records cannot be removed to preserve manufacturing audit trails.
            </p>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPcbToDelete(null);
                }}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button onClick={handleDeletePCB} className="btn btn-danger text-xs">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PCBs;
