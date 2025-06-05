import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import ManualServiceRecordForm from './ManualServiceRecordForm';
import AIReceiptTab from './AIReceiptTab';
import TabNavigation from './TabNavigation';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';
import { getServiceRecordById, getServiceItemsByRecordId } from '../services/serviceRecordService';
import useAIExtraction from '../hooks/useAIExtraction';

type TabView = 'manual' | 'ai';

interface ServiceRecordModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  serviceRecordId?: string; // Optional - if provided, we're editing an existing record
  onSaveManualRecords: (serviceRecord: ServiceRecordInsert, serviceItems: ServiceItemInsert[]) => Promise<ServiceRecord | null>;
}

export default function ServiceRecordModal({ open, onClose, vehicleId, serviceRecordId, onSaveManualRecords }: ServiceRecordModalProps) {
  const [noVehicleError, setNoVehicleError] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<TabView>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingRecord, setExistingRecord] = useState<ServiceRecord | null>(null);
  const [existingItems, setExistingItems] = useState<ServiceItem[]>([]);
  
  // Use our custom hook for AI extraction functionality
  const {
    isProcessing: isAIProcessing,
    isSaving,
    error: aiError,
    extractedRecord: aiExtractedRecord,
    extractedItems: aiExtractedItems,
    handleAnalysisComplete,
    saveExtractedRecord: handleSaveAiRecords,
    resetExtractedData
  } = useAIExtraction({
    onSaveServiceRecord: onSaveManualRecords
  });

  // Fetch existing record data if serviceRecordId is provided
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!serviceRecordId || !open) return;
      
      // Force manual tab when editing
      setSelectedTab('manual');
      
      setIsLoading(true);
      try {
        const record = await getServiceRecordById(serviceRecordId);
        const items = await getServiceItemsByRecordId(serviceRecordId);
        
        if (record) {
          setExistingRecord(record);
          setExistingItems(items);
        }
      } catch (error) {
        console.error('Error fetching service record data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingData();
  }, [serviceRecordId, open]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setExistingRecord(null);
      setExistingItems([]);
      setSaveError(null);
      setNoVehicleError(false);
      resetExtractedData();
    }
  }, [open, resetExtractedData]);
  
  // Check if vehicle is selected
  useEffect(() => {
    if (open) {
      setNoVehicleError(!vehicleId || vehicleId.trim() === '');
    }
  }, [open, vehicleId]);
  
  // Handle modal close
  const handleClose = () => {
    onClose();
  };
  
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-40 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all w-full max-w-3xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {serviceRecordId ? 'Edit Service Record' : 'Add Service Record'}
                </Dialog.Title>
                
                {(saveError || noVehicleError) && (
                  <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">
                      {noVehicleError 
                        ? 'Please select a vehicle before creating a service record.' 
                        : saveError}
                    </p>
                  </div>
                )}
                
                {/* Tab Navigation */}
                <TabNavigation 
                  selectedTab={selectedTab}
                  onTabChange={(tab) => setSelectedTab(tab as TabView)}
                  tabs={[
                    { id: 'manual', label: 'Manual Entry' },
                    // Only show AI tab for new records
                    ...(serviceRecordId ? [] : [{ id: 'ai', label: 'Use AI' }])
                  ]}
                />
                
                {/* Tab Content */}
                <div className="mt-4">
                  {selectedTab === 'manual' && (
                    isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <ManualServiceRecordForm 
                        vehicleId={vehicleId} 
                        onSave={onSaveManualRecords} 
                        onCancel={handleClose}
                        disabled={isSaving || noVehicleError}
                        existingRecord={existingRecord}
                        existingItems={existingItems}
                      />
                    )
                  )}
                  
                  {selectedTab === 'ai' && (
                    <AIReceiptTab
                      isProcessing={isAIProcessing}
                      isSaving={isSaving}
                      error={aiError || (noVehicleError ? 'Please select a vehicle first' : null)}
                      extractedRecord={aiExtractedRecord}
                      extractedItems={aiExtractedItems}
                      onAnalysisComplete={handleAnalysisComplete}
                      onSave={() => handleSaveAiRecords(vehicleId)}
                      onReset={resetExtractedData}
                      disabled={noVehicleError}
                    />
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
