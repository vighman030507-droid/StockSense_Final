import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, FileText, ArrowDownToLine, Layers, AlertTriangle } from 'lucide-react';

const ExcelManagement = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleExport = async (endpoint, filename) => {
    try {
      toast.loading('Preparing workbook export...', { id: 'export' });

      const response = await axiosInstance.get(endpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Spreadsheet exported successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export generation failed', { id: 'export' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('updateExisting', 'true');

      const response = await axiosInstance.post('/api/excel/import/components', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);

      if (response.data.success) {
        toast.success('Batch import completed!');
      } else {
        toast.error('Import processed with errors');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorData = error.response?.data;
      setImportResult({
        success: false,
        message: errorData?.message || 'Import failed',
        error: errorData?.error || 'Spreadsheet processing encountered an error',
      });
      toast.error('Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = async () => {
    await handleExport('/api/excel/import/template', 'stocksense_component_template.xlsx');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Excel Data Exchange
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automated batch component import with header mapping, inventory exports, and consumption auditing
        </p>
      </div>

      {/* Import Section */}
      <div className="card p-6 sm:p-7 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border-blue-200 dark:border-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
            <Upload className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Bulk Import Electronic Components
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Upload an Excel (.xlsx or .xls) spreadsheet to bulk-insert or upsert parts. Column headers like{' '}
              <code className="text-blue-600 dark:text-blue-400 font-mono">Part Number</code>,{' '}
              <code className="text-blue-600 dark:text-blue-400 font-mono">Component Name</code>, and{' '}
              <code className="text-blue-600 dark:text-blue-400 font-mono">Monthly Required</code> are automatically detected.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Template Download Button */}
              <button onClick={downloadTemplate} className="btn btn-secondary text-xs">
                <Download className="w-4 h-4 mr-1.5" />
                <span>Download Sample Template</span>
              </button>

              {/* Upload Action */}
              <label className="btn btn-primary text-xs cursor-pointer">
                {importing ? (
                  <>
                    <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span>Parsing & Importing Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" />
                    <span>Select Spreadsheet (.xlsx, .xls)</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Import Result Notification Box */}
      {importResult && (
        <div
          className={`card p-6 border-2 animate-fadeIn ${
            importResult.success
              ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            {importResult.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-base ${importResult.success ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
                {importResult.message || (importResult.success ? 'Import Completed' : 'Import Unsuccessful')}
              </h3>

              {importResult.summary && (
                <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{importResult.summary.total_rows}</p>
                      <p className="text-xs text-slate-400">Total Rows</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{importResult.summary.inserted}</p>
                      <p className="text-xs text-slate-400">Inserted</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{importResult.summary.updated}</p>
                      <p className="text-xs text-slate-400">Updated</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{importResult.summary.skipped}</p>
                      <p className="text-xs text-slate-400">Skipped</p>
                    </div>
                  </div>
                  <div className="text-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Success Rate: {importResult.summary.success_rate}
                  </div>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-xs">
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-2">Errors ({importResult.errors.length}):</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {importResult.errors.map((err, index) => (
                      <div key={index} className="py-1 border-b border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                        <span className="font-bold text-rose-600">Row {err.row}:</span> {err.error} {err.message ? `— ${err.message}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Export Production & Inventory Datasets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download formatted Excel workbooks with calculated metrics, stock percentages, and lot audit trails
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Inventory Report Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Complete Inventory List
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Full snapshot of all components, stock counts, units of measure, and stock statuses.
              </p>
            </div>
            <button
              onClick={() =>
                handleExport(
                  '/api/excel/export/inventory',
                  `stocksense_inventory_${new Date().toISOString().split('T')[0]}.xlsx`
                )
              }
              className="btn btn-primary w-full text-xs font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>Export Inventory (.xlsx)</span>
            </button>
          </div>

          {/* Consumption Report Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/60 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Consumption Audit History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Detailed transaction records including lot codes, stock before/after, and PCB IDs.
              </p>
            </div>
            <button
              onClick={() =>
                handleExport(
                  '/api/excel/export/consumption',
                  `stocksense_consumption_${new Date().toISOString().split('T')[0]}.xlsx`
                )
              }
              className="btn btn-secondary w-full text-xs font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>Export Consumption (.xlsx)</span>
            </button>
          </div>

          {/* Low Stock Report Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/60 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Low Stock & Shortages
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Reorder report prioritizing parts under 20% with shortage calculations and daily velocity.
              </p>
            </div>
            <button
              onClick={() =>
                handleExport(
                  '/api/excel/export/low-stock',
                  `stocksense_low_stock_${new Date().toISOString().split('T')[0]}.xlsx`
                )
              }
              className="btn btn-danger w-full text-xs font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>Export Shortages (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelManagement;
