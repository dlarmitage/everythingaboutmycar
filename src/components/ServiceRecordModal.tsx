import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import ManualServiceRecordForm from './ManualServiceRecordForm';
import AIReceiptTab from './AIReceiptTab';
import TabNavigation from './TabNavigation';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';
import { getServiceRecordById, getServiceItemsByRecordId, deleteServiceRecord } from '../services/serviceRecordService';
import useAIExtraction from '../hooks/useAIExtraction';

type TabView = 'manual' | 'ai';

interface ServiceRecordModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  serviceRecordId?: string; // Optional - if provided, we're editing an existing record
  onSaveManualRecords: (serviceRecord: ServiceRecordInsert, serviceItems: ServiceItemInsert[]) => Promise<ServiceRecord | null>;
  onDelete?: (serviceRecordId: string) => Promise<void>; // Optional - for deleting existing records
}

export default function ServiceRecordModal({ open, onClose, vehicleId, serviceRecordId, onSaveManualRecords, onDelete }: ServiceRecordModalProps) {
  const [noVehicleError, setNoVehicleError] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<TabView>(serviceRecordId ? 'manual' : 'ai');
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingRecord, setExistingRecord] = useState<ServiceRecord | null>(null);
  const [existingItems, setExistingItems] = useState<ServiceItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
    } else {
      // Reset tab selection when modal opens
      setSelectedTab(serviceRecordId ? 'manual' : 'ai');
    }
  }, [open, resetExtractedData, serviceRecordId]);
  
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

  // Handle delete confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!serviceRecordId) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteServiceRecord(serviceRecordId);
      if (success) {
        // Call the parent's onDelete handler if provided
        if (onDelete) {
          await onDelete(serviceRecordId);
        }
        handleClose();
      } else {
        setSaveError('Failed to delete service record');
      }
    } catch (error) {
      console.error('Error deleting service record:', error);
      setSaveError('Failed to delete service record');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
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
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {serviceRecordId ? 'Edit Service Record' : 'Add Service Record'}
                    </Dialog.Title>
                    
                    {/* Delete button - only show when editing existing record */}
                    {serviceRecordId && (
                      <button
                        type="button"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
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
                      // Only show AI tab for new records
                      ...(serviceRecordId ? [] : [{ id: 'ai', label: 'Use AI' }]),
                      { id: 'manual', label: 'Manual Entry' }
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

      {/* Delete Confirmation Dialog */}
      <Transition.Root show={showDeleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleDeleteCancel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Delete Service Record
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this service record? This action cannot be undone. All associated service items will also be deleted.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={handleDeleteCancel}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
