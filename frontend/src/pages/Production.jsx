import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Factory, CheckCircle, XCircle } from 'lucide-react';

const Production = () => {
  const [pcbs, setPcbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('pcb'); // 'pcb' or 'component_string'

  const [formData, setFormData] = useState({
    pcb_id: '',
    component_string: '',
    quantity_produced: 1,
    production_date: new Date().toISOString().split('T')[0],
    lot_number: '',
    notes: '',
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchPCBs();
  }, []);

  const fetchPCBs = async () => {
    try {
      const response = await axiosInstance.get('/api/pcbs');
      setPcbs(response.data.data.pcbs || []);
    } catch (error) {
      console.error('Failed to fetch PCBs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = mode === 'pcb'
        ? {
          pcb_id: parseInt(formData.pcb_id),
          quantity_produced: parseInt(formData.quantity_produced),
          production_date: formData.production_date,
          lot_number: formData.lot_number,
          notes: formData.notes,
        }
        : {
          component_string: formData.component_string,
          lot_number: formData.lot_number,
          production_date: formData.production_date,
          notes: formData.notes,
        };

      const response = await axiosInstance.post('/api/production', payload);

      setResult({
        success: true,
        data: response.data.data,
      });

      toast.success('Production entry created successfully!');

      // Reset form
      setFormData({
        pcb_id: '',
        component_string: '',
        quantity_produced: 1,
        production_date: new Date().toISOString().split('T')[0],
        lot_number: '',
        notes: '',
      });

    } catch (error) {
      const errorData = error.response?.data;

      setResult({
        success: false,
        error: errorData?.error || 'Production entry failed',
        insufficientStock: errorData?.insufficientStock || [],
      });

      toast.error(errorData?.error || 'Production entry failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Production Entry</h1>
        <p className="text-gray-600 mt-1">Record new production with automatic stock deduction</p>
      </div>

      {/* Mode Selector */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Production Mode</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setMode('pcb')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${mode === 'pcb'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <h4 className="font-bold text-gray-900">PCB-Based Production</h4>
            <p className="text-sm text-gray-600 mt-1">
              Select a PCB and quantity - components deducted based on BOM
            </p>
          </button>

          <button
            onClick={() => setMode('component_string')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${mode === 'component_string'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <h4 className="font-bold text-gray-900">Component String</h4>
            <p className="text-sm text-gray-600 mt-1">
              Enter component codes (e.g., "BZ/IC1/VR1") - deducts 1 unit each
            </p>
          </button>
        </div>
      </div>

      {/* Production Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Production Details</h2>

        {mode === 'pcb' ? (
          <>
            <div>
              <label className="form-label">Select PCB *</label>
              <select
                value={formData.pcb_id}
                onChange={(e) => setFormData({ ...formData, pcb_id: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Choose a PCB...</option>
                {pcbs.map((pcb) => (
                  <option key={pcb.id} value={pcb.id}>
                    {pcb.pcb_code} - {pcb.pcb_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Quantity Produced *</label>
              <input
                type="number"
                value={formData.quantity_produced}
                onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })}
                className="form-input"
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Components will be deducted: quantity_per_pcb × quantity_produced
              </p>
            </div>
          </>
        ) : (
          <div>
            <label className="form-label">Component String *</label>
            <input
              type="text"
              value={formData.component_string}
              onChange={(e) => setFormData({ ...formData, component_string: e.target.value })}
              className="form-input font-mono"
              placeholder="CAP-10UF-001/RES-1K-001/LED-RED-5MM"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: Component codes separated by "/" (e.g., "CAP-10UF-001/RES-1K-001/LED-RED-5MM")
              <br />
              Duplicates will be removed automatically. Exactly 1 unit deducted per component.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Production Date *</label>
            <input
              type="date"
              value={formData.production_date}
              onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Lot Number *</label>
            <input
              type="text"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              className="form-input font-mono"
              placeholder="LOT-2025-001"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="form-input"
            rows="3"
            placeholder="Optional production notes..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary py-3 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Factory className="w-5 h-5" />
              <span>Create Production Entry</span>
            </>
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`card ${result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}

            <div className="flex-1">
              <h3 className={`font-bold text-lg ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? 'Production Entry Created!' : 'Production Failed'}
              </h3>

              {result.success ? (
                <div className="mt-3 space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Production ID:</strong> #{result.data.productionEntry.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Lot Number:</strong> {result.data.productionEntry.lot_number}
                    </p>
                    {result.data.componentsParsed && (
                      <p className="text-sm text-gray-600">
                        <strong>Components Parsed:</strong> {result.data.componentsParsed.join(', ')}
                      </p>
                    )}
                  </div>

                  {result.data.consumptionRecords?.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Stock Deductions:</h4>
                      <div className="space-y-2">
                        {result.data.consumptionRecords.map((record, index) => (
                          <div key={index} className="text-sm flex items-center justify-between border-b border-gray-100 pb-2">
                            <span>
                              <strong>{record.part_number}</strong> - {record.component_name}
                            </span>
                            <span className="font-mono">
                              {record.stock_before} → {record.stock_after} (-{record.quantity_consumed})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.data.procurementTriggers?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-bold text-yellow-900 mb-2">⚠️ Low Stock Alerts Generated:</h4>
                      <div className="space-y-1">
                        {result.data.procurementTriggers.map((trigger, index) => (
                          <p key={index} className="text-sm text-yellow-800">
                            • {trigger.part_number} - {trigger.component_name} (Stock: {trigger.current_stock}, Required: {trigger.monthly_requirement})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-red-800 mb-3">{result.error}</p>

                  {result.insufficientStock?.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Insufficient Stock:</h4>
                      <div className="space-y-2">
                        {result.insufficientStock.map((item, index) => (
                          <div key={index} className="text-sm border-b border-gray-100 pb-2">
                            <p>
                              <strong>{item.part_number}</strong> - {item.component_name}
                            </p>
                            <p className="text-red-600">
                              Required: {item.required}, Available: {item.available},
                              Shortage: {item.shortage}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
