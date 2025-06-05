import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';
import ManualServiceRecordForm from './ManualServiceRecordForm';
import AIReceiptTab from './AIReceiptTab';
import TabNavigation from './TabNavigation';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';
import { getServiceRecordById, getServiceItemsByRecordId, deleteServiceRecord } from '../services/serviceRecordService';
import useAIExtraction from '../hooks/useAIExtraction';
import { supabase } from '../services/supabase';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<{
    record: ServiceRecordInsert;
    items: Omit<ServiceItemInsert, 'service_record_id'>[];
  } | null>(null);
  const [originalFormData, setOriginalFormData] = useState<{
    record: ServiceRecordInsert;
    items: Omit<ServiceItemInsert, 'service_record_id'>[];
  } | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

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
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setHasUnsavedChanges(false);
      setShowUnsavedChangesDialog(false);
      setPendingFormData(null);
      setOriginalFormData(null);
      setSelectedTab(serviceRecordId ? 'manual' : 'ai');
    } else {
      // Reset all state when modal closes
      setHasUnsavedChanges(false);
      setShowUnsavedChangesDialog(false);
      setPendingFormData(null);
      setOriginalFormData(null);
      resetExtractedData();
      setExistingRecord(null);
      setExistingItems([]);
      setSaveError(null);
      setSelectedTab('manual');
    }
  }, [open, resetExtractedData]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      // Save current scroll position and lock body
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Prevent wheel events on the document
      const preventScroll = (e: WheelEvent) => {
        // Only prevent scroll if the target is not within the modal content
        const target = e.target as Element;
        const modalPanel = document.querySelector('[role="dialog"]');
        if (modalPanel && !modalPanel.contains(target)) {
          e.preventDefault();
        }
      };
      
      const preventTouch = (e: TouchEvent) => {
        // Only prevent touch if the target is not within the modal content
        const target = e.target as Element;
        const modalPanel = document.querySelector('[role="dialog"]');
        if (modalPanel && !modalPanel.contains(target)) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventTouch, { passive: false });
      
      // Store the cleanup function
      const cleanup = () => {
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventTouch);
      };
      
      return cleanup;
    } else {
      // Restore scroll position and unlock body
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [open]);

  // Set original form data when existing data is loaded
  useEffect(() => {
    if (existingRecord && existingItems && existingItems.length > 0) {
      const originalRecord: ServiceRecordInsert = {
        vehicle_id: existingRecord.vehicle_id,
        service_date: existingRecord.service_date,
        service_provider: existingRecord.service_provider,
        mileage: existingRecord.mileage,
        total_cost: existingRecord.total_cost,
        notes: existingRecord.notes,
        document_url: existingRecord.document_url,
        id: existingRecord.id
      };
      
      const originalItems: Omit<ServiceItemInsert, 'service_record_id'>[] = existingItems.map(item => ({
        id: item.id,
        service_type: item.service_type,
        description: item.description,
        cost: item.cost,
        parts_replaced: item.parts_replaced,
        quantity: item.quantity,
        next_service_date: item.next_service_date,
        next_service_mileage: item.next_service_mileage
      }));
      
      setOriginalFormData({ record: originalRecord, items: originalItems });
    }
  }, [existingRecord, existingItems]);

  // Check if vehicle is selected
  useEffect(() => {
    if (open) {
      setNoVehicleError(!vehicleId || vehicleId.trim() === '');
    }
  }, [open, vehicleId]);
  
  // Fetch document URL when modal opens and there's a document_id
  useEffect(() => {
    const fetchDocumentUrl = async () => {
      if (open && existingRecord?.document_id) {
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('file_url')
            .eq('id', existingRecord.document_id)
            .single();
          
          if (error) {
            console.error('Error fetching document URL:', error);
            setDocumentUrl(null);
          } else {
            setDocumentUrl(data?.file_url || null);
          }
        } catch (err) {
          console.error('Error fetching document URL:', err);
          setDocumentUrl(null);
        }
      } else {
        setDocumentUrl(null);
      }
    };
    
    fetchDocumentUrl();
  }, [open, existingRecord?.document_id]);

  // Function to compare form data for changes
  const hasFormDataChanged = (
    current: { record: ServiceRecordInsert; items: Omit<ServiceItemInsert, 'service_record_id'>[] },
    original: { record: ServiceRecordInsert; items: Omit<ServiceItemInsert, 'service_record_id'>[] } | null
  ): boolean => {
    if (!original) return true; // If no original data, consider it changed
    
    // Compare record fields
    const recordChanged = (
      current.record.service_date !== original.record.service_date ||
      current.record.service_provider !== original.record.service_provider ||
      current.record.mileage !== original.record.mileage ||
      current.record.total_cost !== original.record.total_cost
    );
    
    if (recordChanged) return true;
    
    // Compare items count
    if (current.items.length !== original.items.length) return true;
    
    // Compare each item
    for (let i = 0; i < current.items.length; i++) {
      const currentItem = current.items[i];
      const originalItem = original.items[i];
      
      if (
        currentItem.service_type !== originalItem.service_type ||
        currentItem.description !== originalItem.description ||
        currentItem.cost !== originalItem.cost ||
        JSON.stringify(currentItem.parts_replaced) !== JSON.stringify(originalItem.parts_replaced) ||
        currentItem.quantity !== originalItem.quantity ||
        currentItem.next_service_date !== originalItem.next_service_date ||
        currentItem.next_service_mileage !== originalItem.next_service_mileage
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Handle modal close with auto-save
  const handleClose = () => {
    if (hasUnsavedChanges && pendingFormData) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Handle saving pending changes
  const handleSavePendingChanges = async () => {
    if (pendingFormData) {
      try {
        // Convert items back to ServiceItemInsert by adding empty service_record_id
        const itemsWithRecordId: ServiceItemInsert[] = pendingFormData.items.map(item => ({
          ...item,
          service_record_id: '' // This will be set by the service when saving
        }));
        await onSaveManualRecords(pendingFormData.record, itemsWithRecordId);
        setHasUnsavedChanges(false);
        setPendingFormData(null);
        setShowUnsavedChangesDialog(false);
        onClose();
      } catch (error) {
        console.error('Error saving changes:', error);
        setSaveError('Failed to save changes');
        setShowUnsavedChangesDialog(false);
      }
    }
  };

  // Handle discarding changes
  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setPendingFormData(null);
    setShowUnsavedChangesDialog(false);
    onClose();
  };

  // Handle form data changes from ManualServiceRecordForm
  const handleFormDataChange = (record: ServiceRecordInsert, items: Omit<ServiceItemInsert, 'service_record_id'>[]) => {
    const currentData = { record, items };
    setPendingFormData(currentData);
    
    // Check if data has actually changed from original
    const hasChanged = hasFormDataChanged(currentData, originalFormData);
    setHasUnsavedChanges(hasChanged);
  };

  // Handle delete confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleShowDocument = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
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
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all w-full max-w-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {serviceRecordId ? 'Edit Service Record' : 'Add Service Record'}
                    </Dialog.Title>
                    
                    {/* Close button (X) in upper right */}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
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
                          existingRecord={existingRecord}
                          existingItems={existingItems}
                          onFormDataChange={handleFormDataChange}
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
                  
                  {/* Footer with discrete delete button for existing records */}
                  {serviceRecordId && (
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                      {/* Show Document button (left side) */}
                      {documentUrl && (
                        <button
                          type="button"
                          onClick={handleShowDocument}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="View document"
                        >
                          <DocumentIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Show Document
                        </button>
                      )}
                      
                      {/* Spacer div when no document */}
                      {!documentUrl && <div></div>}
                      
                      {/* Delete button (right side) */}
                      <button
                        type="button"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete service record"
                      >
                        {isDeleting ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  )}
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
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
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

      {/* Unsaved Changes Dialog */}
      <Transition.Root show={showUnsavedChangesDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleDiscardChanges}>
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
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Unsaved Changes
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          You have unsaved changes. Do you want to save them before closing?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleSavePendingChanges}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={handleDiscardChanges}
                    >
                      Discard Changes
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
