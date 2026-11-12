import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

const ExcelManagement = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleExport = async (endpoint, filename) => {
    try {
      toast.loading('Generating export...', { id: 'export' });
      
      const response = await axiosInstance.get(endpoint, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', { id: 'export' });
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
        toast.success('Import completed successfully!');
      } else {
        toast.error('Import completed with errors');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorData = error.response?.data;
      setImportResult({
        success: false,
        message: errorData?.message || 'Import failed',
        error: errorData?.error || 'An error occurred',
      });
      toast.error('Import failed');
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  const downloadTemplate = async () => {
    await handleExport('/api/excel/import/template', 'component_import_template.xlsx');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Excel Management</h1>
        <p className="text-gray-600 mt-1">Import and export data in Excel format</p>
      </div>

      {/* Import Section */}
      <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="p-4 bg-blue-500 rounded-full">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Components</h2>
            <p className="text-gray-700 mb-4">
              Upload an Excel file to bulk import or update components in the system
            </p>

            <div className="space-y-4">
              {/* Download Template Button */}
              <button
                onClick={downloadTemplate}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>

              {/* File Upload */}
              <div>
                <label className="block">
                  <div className="btn btn-primary flex items-center justify-center space-x-2 cursor-pointer">
                    {importing ? (
                      <>
                        <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Select Excel File to Import</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Import Instructions */}
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">Import Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Download the template file</li>
                  <li>Fill in component data (Part Number, Component Name, etc.)</li>
                  <li>Upload the completed file</li>
                  <li>System will automatically create or update components</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`card ${importResult.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <div className="flex items-start space-x-3">
            {importResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {importResult.message || (importResult.success ? 'Import Successful' : 'Import Failed')}
              </h3>

              {importResult.summary && (
                <div className="mt-3 bg-white rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{importResult.summary.total_rows}</p>
                      <p className="text-sm text-gray-600">Total Rows</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{importResult.summary.inserted}</p>
                      <p className="text-sm text-gray-600">Inserted</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{importResult.summary.updated}</p>
                      <p className="text-sm text-gray-600">Updated</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{importResult.summary.skipped}</p>
                      <p className="text-sm text-gray-600">Skipped</p>
                    </div>
                  </div>
                  <p className="text-center mt-3 text-sm font-bold text-gray-700">
                    Success Rate: {importResult.summary.success_rate}
                  </p>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 bg-white rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Errors ({importResult.errors.length}):</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm border-b border-gray-100 pb-2">
                        <p className="text-red-600">
                          <strong>Row {error.row}:</strong> {error.error}
                        </p>
                        {error.message && (
                          <p className="text-gray-600">{error.message}</p>
                        )}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-sm text-gray-500 italic">
                        ...and {importResult.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="card">
        <div className="flex items-start space-x-4 mb-6">
          <div className="p-4 bg-green-500 rounded-full">
            <Download className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Data</h2>
            <p className="text-gray-700">
              Export inventory, consumption history, and reports to Excel format
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export Inventory */}
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Inventory Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Complete component inventory with stock levels and status
            </p>
            <button
              onClick={() => handleExport('/api/excel/export/inventory', `inventory_${new Date().toISOString().split('T')[0]}.xlsx`)}
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Inventory</span>
            </button>
          </div>

          {/* Export Consumption */}
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Consumption History</h3>
            <p className="text-sm text-gray-600 mb-4">
              Detailed component consumption records with lot traceability
            </p>
            <button
              onClick={() => handleExport('/api/excel/export/consumption', `consumption_${new Date().toISOString().split('T')[0]}.xlsx`)}
              className="btn w-full flex items-center justify-center space-x-2"
              style={{ background: '#9333ea', color: 'white' }}
            >
              <Download className="w-4 h-4" />
              <span>Export Consumption</span>
            </button>
          </div>

          {/* Export Low Stock */}
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-red-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Low Stock Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Components below threshold with reorder recommendations
            </p>
            <button
              onClick={() => handleExport('/api/excel/export/low-stock', `low_stock_${new Date().toISOString().split('T')[0]}.xlsx`)}
              className="btn btn-danger w-full flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Low Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Automatic Column Mapping</p>
              <p className="text-sm text-gray-600">Flexible column name detection</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Row-by-Row Validation</p>
              <p className="text-sm text-gray-600">Detailed error reporting</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Upsert Support</p>
              <p className="text-sm text-gray-600">Insert new or update existing components</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Rich Excel Exports</p>
              <p className="text-sm text-gray-600">Formatted with summaries and styling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelManagement;
