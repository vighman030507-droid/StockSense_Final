import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Factory, CheckCircle, XCircle, AlertTriangle, Layers, Cpu, ArrowRight, Hash, Calendar, FileText } from 'lucide-react';

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
      setPcbs(response.data.data?.pcbs || []);
    } catch (error) {
      console.error('Failed to fetch PCBs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload =
        mode === 'pcb'
          ? {
              pcb_id: parseInt(formData.pcb_id, 10),
              quantity_produced: parseInt(formData.quantity_produced, 10) || 1,
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

      toast.success('Production run logged & inventory deducted!');

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Record Production Run
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Log finished assembly batches with automatic atomic Bill of Materials stock deduction
        </p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setMode('pcb')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            mode === 'pcb'
              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3 mb-1.5">
            <div className={`p-2 rounded-lg ${mode === 'pcb' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">PCB BOM Production</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-11">
            Select a configured PCB and quantity. Components are deducted according to the defined Bill of Materials.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode('component_string')}
          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
            mode === 'component_string'
              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3 mb-1.5">
            <div className={`p-2 rounded-lg ${mode === 'component_string' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Component String Mode</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-11">
            Input a delimiter-separated code string (e.g. BZ/IC1/VR1). Exactly 1 unit is deducted per unique code.
          </p>
        </button>
      </div>

      {/* Production Form */}
      <form onSubmit={handleSubmit} className="card p-6 sm:p-7 space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          Batch Parameters
        </h2>

        {mode === 'pcb' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Select PCB Assembly *</label>
              <select
                value={formData.pcb_id}
                onChange={(e) => setFormData({ ...formData, pcb_id: e.target.value })}
                className="form-input text-xs"
                required
              >
                <option value="">Select a registered PCB...</option>
                {pcbs.map((pcb) => (
                  <option key={pcb.id} value={pcb.id}>
                    {pcb.pcb_code} &bull; {pcb.pcb_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Units Produced *</label>
              <input
                type="number"
                value={formData.quantity_produced}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity_produced: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                className="form-input text-sm font-semibold"
                min="1"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total deductions = BOM component quantity &times; units produced
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="form-label">Component String Expression *</label>
            <input
              type="text"
              value={formData.component_string}
              onChange={(e) => setFormData({ ...formData, component_string: e.target.value })}
              className="form-input font-mono text-xs uppercase"
              placeholder="e.g. CAP-10UF-001/RES-1K-001/LED-RED-5MM"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Enter component codes separated by &quot;/&quot;. Duplicates are parsed out; 1 unit deducted per component.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Manufacturing Date *</label>
            <div className="relative">
              <input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Lot / Batch Tracking Code *</label>
            <input
              type="text"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              className="form-input font-mono text-xs uppercase"
              placeholder="e.g. LOT-2026-B101"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label">Production Run Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="form-input text-xs"
            rows="2"
            placeholder="Operator initials, shift, inspection notes..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20"
        >
          {loading ? (
            <>
              <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              <span>Processing Stock Deductions...</span>
            </>
          ) : (
            <>
              <Factory className="w-4 h-4 mr-2" />
              <span>Execute Production Run & Deduct Stock</span>
            </>
          )}
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div
          className={`card p-6 border-2 animate-fadeIn ${
            result.success
              ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-base ${result.success ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
                {result.success ? 'Production Run Completed Successfully' : 'Production Execution Blocked'}
              </h3>

              {result.success ? (
                <div className="mt-4 space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block">Production ID</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{result.data?.productionEntry?.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lot Number</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.data?.productionEntry?.lot_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Units Completed</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{result.data?.productionEntry?.quantity_produced}</span>
                    </div>
                  </div>

                  {result.data?.consumptionRecords?.length > 0 && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2.5">
                        Stock Consumption Log ({result.data.consumptionRecords.length} items deducted):
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {result.data.consumptionRecords.map((record, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-mono text-xs"
                          >
                            <span>
                              <strong>{record.part_number}</strong> &bull; {record.component_name}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {record.stock_before} &rarr; {record.stock_after} (
                              <span className="text-rose-600 dark:text-rose-400">-{record.quantity_consumed}</span>)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.data?.procurementTriggers?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                      <h4 className="font-bold flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Low Stock Procurement Alerts Triggered:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {result.data.procurementTriggers.map((trig, index) => (
                          <li key={index}>
                            {trig.part_number} &bull; {trig.component_name} (Remaining: {trig.current_stock} / Monthly Req: {trig.monthly_requirement})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs">
                  <p className="text-rose-800 dark:text-rose-300 font-medium mb-3">{result.error}</p>

                  {result.insufficientStock?.length > 0 && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60">
                      <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-2">Shortage Breakdown:</h4>
                      <div className="space-y-1.5">
                        {result.insufficientStock.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <strong className="text-slate-900 dark:text-white">{item.part_number}</strong> &bull; {item.component_name}
                            </div>
                            <div className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                              Need: {item.required} &bull; Available: {item.available} &bull; Deficit: {item.shortage}
                            </div>
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
