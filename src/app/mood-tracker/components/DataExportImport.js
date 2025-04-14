"use client"
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Download, 
  Upload, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function DataExportImport({ onImportSuccess }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ type: null, message: '' });

  const exportData = async () => {
    setExporting(true);
    try {
      // Fetch all mood data
      const response = await fetch('/api/moods/export');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const data = await response.json();
      
      // Create downloadable file
      const fileName = `mood_tracker_export_${new Date().toISOString().split('T')[0]}.json`;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      
    } catch (error) {
      console.error("Export error:", error);
      setImportStatus({
        type: 'error',
        message: 'Failed to export data. Please try again.'
      });
    } finally {
      setExporting(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setImportStatus({ type: null, message: '' });
    
    try {
      // Read file
      const text = await file.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file format');
      }
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: Expected an array of mood entries');
      }
      
      // Send to API
      const response = await fetch('/api/moods/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moods: data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const result = await response.json();
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.imported} mood entries.`
      });
      
      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess();
      }
      
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: 'error',
        message: error.message || 'Failed to import data'
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-gray-200">Data Management</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-gray-300 text-sm font-medium mb-2">Export Your Data</h3>
          <p className="text-gray-400 text-sm mb-2">
            Download all your mood tracking data as a JSON file for backup or transfer.
          </p>
          <button
            onClick={exportData}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                     disabled:bg-gray-600 disabled:text-gray-400 rounded-lg text-white transition-colors
                     w-full md:w-48"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </>
            )}
          </button>
        </div>
        
        <div className="pt-2 border-t border-gray-700">
          <h3 className="text-gray-300 text-sm font-medium mb-2">Import Data</h3>
          <p className="text-gray-400 text-sm mb-2">
            Import previously exported mood data. This will merge with your existing data.
          </p>
          
          <label 
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-blue-700 
                     disabled:bg-gray-600 disabled:text-gray-400 rounded-lg text-white transition-colors 
                     cursor-pointer w-full md:w-48 ${importing ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Import Data</span>
              </>
            )}
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={importData}
              disabled={importing}
            />
          </label>
          
          {importStatus.type && (
            <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm
                          ${importStatus.type === 'success' 
                            ? 'bg-green-900 bg-opacity-30 text-green-300' 
                            : 'bg-red-900 bg-opacity-30 text-red-300'}`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 pt-0">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>JSON format containing all your mood entries</span>
        </div>
      </CardFooter>
    </Card>
  );
}