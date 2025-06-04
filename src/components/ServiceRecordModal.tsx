import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import ManualServiceRecordForm from './ManualServiceRecordForm';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/solid';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';
import { getServiceRecordById, getServiceItemsByRecordId } from '../services/serviceRecordService';

type TabView = 'manual' | 'ai';

interface ServiceRecordModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  serviceRecordId?: string; // Optional - if provided, we're editing an existing record
  onSaveManualRecords: (serviceRecord: ServiceRecordInsert, serviceItems: ServiceItemInsert[]) => Promise<void>;
}

export default function ServiceRecordModal({ open, onClose, vehicleId, serviceRecordId, onSaveManualRecords }: ServiceRecordModalProps) {
  const [selectedTab, setSelectedTab] = useState<TabView>('manual');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState<ServiceRecord | null>(null);
  const [existingItems, setExistingItems] = useState<ServiceItem[]>([]);
  
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
        setSaveError('Failed to load service record data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingData();
  }, [serviceRecordId, open]);

  const handleClose = () => {
    setIsAIProcessing(false);
    setAiError(null);
    setSaveError(null);
    setIsSaving(false);
    onClose();
  };

  const handleSaveManualRecords = async (serviceRecord: ServiceRecordInsert, serviceItems: ServiceItemInsert[]) => {
    setSaveError(null);
    setIsSaving(true);
    
    try {
      // Validate required fields
      if (!serviceRecord.service_date) {
        setSaveError('Service date is required');
        setIsSaving(false);
        return;
      }
      
      // Validate service items
      if (!serviceItems.length || !serviceItems.some(item => item.service_type.trim() !== '')) {
        setSaveError('At least one service item with a service type is required');
        setIsSaving(false);
        return;
      }
      
      if (typeof onSaveManualRecords !== 'function') {
        throw new Error('Save function is not available');
      }
      
      await onSaveManualRecords(serviceRecord, serviceItems);
      // The modal will be closed by the parent component on successful save
    } catch (error: any) {
      console.error('Error saving service record:', error);
      setSaveError(error.message || 'Failed to save service record');
    } finally {
      setIsSaving(false);
    }
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
                
                {saveError && (
                  <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{saveError}</p>
                  </div>
                )}
                
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setSelectedTab('manual')}
                      className={`${selectedTab === 'manual' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      Manual Entry
                    </button>
                    <button
                      onClick={() => setSelectedTab('ai')}
                      className={`${selectedTab === 'ai' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Use AI
                    </button>
                  </nav>
                </div>
                
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
                        onSave={handleSaveManualRecords} 
                        onCancel={handleClose}
                        disabled={isSaving}
                        existingRecord={existingRecord}
                        existingItems={existingItems}
                      />
                    )
                  )}
                  
                  {selectedTab === 'ai' && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                      <SparklesIcon className="h-12 w-12 text-gray-300 mb-4" aria-hidden="true" />
                      <p className="text-sm text-gray-600 mb-6">
                        Upload a service receipt or invoice to automatically extract service details
                      </p>
                      <label className="cursor-pointer rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                        Upload Receipt
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={() => {
                            // AI processing functionality will be implemented later
                            setIsAIProcessing(true);
                            setTimeout(() => {
                              setIsAIProcessing(false);
                              setAiError('AI processing feature is coming soon!');
                            }, 1000);
                          }}
                        />
                      </label>
                      {isAIProcessing && (
                        <p className="mt-4 text-sm text-gray-600">Processing your receipt...</p>
                      )}
                      {aiError && (
                        <p className="mt-4 text-sm text-red-600">{aiError}</p>
                      )}
                    </div>
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
