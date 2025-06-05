import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, DocumentAnalysisResult } from '../types';
import DocumentUploader from './DocumentUploader';

interface AIReceiptTabProps {
  isProcessing: boolean;
  isSaving: boolean;
  error: string | null;
  extractedRecord: ServiceRecordInsert | null;
  extractedItems: ServiceItemInsert[];
  onAnalysisComplete: (result: DocumentAnalysisResult, documentId: string) => Promise<void>;
  onSave: () => Promise<ServiceRecord | null>;
  onReset: () => void;
  disabled?: boolean;
}

export default function AIReceiptTab({
  isProcessing,
  isSaving,
  error,
  extractedRecord,
  extractedItems,
  onAnalysisComplete,
  onSave,
  onReset,
  disabled = false
}: AIReceiptTabProps) {
  return (
    <div className="flex flex-col">
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {!extractedRecord ? (
        // Document upload and analysis UI
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Upload a service receipt or invoice to automatically extract service details.</p>
          {isProcessing && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Analyzing document...</span>
            </div>
          )}
          {!isProcessing && (
            <DocumentUploader
              onAnalysisComplete={onAnalysisComplete}
              disabled={disabled}
            />
          )}
        </div>
      ) : (
        // Display extracted service record data for confirmation
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold">Extracted Service Record</h3>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={onReset}
              disabled={disabled}
            >
              Upload Different Document
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Service Date</p>
                <p className="text-sm text-gray-900">{extractedRecord.service_date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Service Provider</p>
                <p className="text-sm text-gray-900">{extractedRecord.service_provider || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Mileage</p>
                <p className="text-sm text-gray-900">{extractedRecord.mileage || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Total Cost</p>
                <p className="text-sm text-gray-900">
                  {extractedRecord.total_cost ? `$${extractedRecord.total_cost.toFixed(2)}` : 'Not specified'}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Service Items</p>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {extractedItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.service_type}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.description || 'No description'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {item.cost ? `$${item.cost.toFixed(2)}` : 'Not specified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {extractedItems.some(item => item.parts_replaced && item.parts_replaced.length > 0) && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Parts Replaced</p>
                <ul className="list-disc pl-5 text-sm text-gray-900">
                  {extractedItems
                    .filter(item => item.parts_replaced && item.parts_replaced.length > 0)
                    .flatMap(item => item.parts_replaced || [])
                    .map((part, index) => (
                      <li key={index}>{part}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              disabled={isSaving || disabled}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onSave}
            >
              {isSaving ? 'Saving...' : 'Save and Link to Document'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
