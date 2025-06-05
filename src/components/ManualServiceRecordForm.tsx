import { useState, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';

interface ManualServiceRecordFormProps {
  vehicleId: string;
  existingRecord?: ServiceRecord | null;
  existingItems?: ServiceItem[] | null;
  onFormDataChange?: (record: ServiceRecordInsert, items: Omit<ServiceItemInsert, 'service_record_id'>[]) => void;
}

interface ServiceItemFormState {
  id: string;
  service_type: string;
  description: string;
  cost: string | number;
  parts_replaced: string;
  quantity: string | number;
}

const newServiceItemId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function ManualServiceRecordForm({ 
  vehicleId, 
  existingRecord = null,
  existingItems = null,
  onFormDataChange
}: ManualServiceRecordFormProps) {
  const [serviceDate, setServiceDate] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [mileage, setMileage] = useState<number | string>('');
  const [serviceItems, setServiceItems] = useState<ServiceItemFormState[]>([
    { id: newServiceItemId(), service_type: '', description: '', cost: '', parts_replaced: '', quantity: '1' },
  ]);
  
  // Initialize form with existing data if provided
  useEffect(() => {
    if (existingRecord) {
      setServiceDate(existingRecord.service_date || '');
      setServiceProvider(existingRecord.service_provider || '');
      setMileage(existingRecord.mileage?.toString() || '');
    }
    
    if (existingItems && existingItems.length > 0) {
      const formattedItems: ServiceItemFormState[] = existingItems.map(item => ({
        id: item.id,
        service_type: item.service_type || '',
        description: item.description || '',
        cost: item.cost?.toString() || '',
        parts_replaced: item.parts_replaced ? item.parts_replaced.join(', ') : '',
        quantity: item.quantity?.toString() || '1',
      }));
      
      setServiceItems(formattedItems);
    }
  }, [existingRecord, existingItems]);

  // Track form changes and notify parent
  useEffect(() => {
    if (onFormDataChange && (serviceDate || serviceProvider || mileage || serviceItems.some(item => 
      item.service_type || item.description || item.cost || item.parts_replaced
    ))) {
      // Calculate total cost from all service items
      const totalCost = serviceItems.reduce((sum, item) => {
        const itemCost = item.cost ? Number(item.cost) : 0;
        const quantity = item.quantity ? Number(item.quantity) : 1;
        return sum + (itemCost * quantity);
      }, 0);

      const serviceRecord: ServiceRecordInsert = {
        vehicle_id: vehicleId,
        service_date: serviceDate,
        service_provider: serviceProvider || null,
        mileage: mileage ? Number(mileage) : null,
        total_cost: totalCost || null,
        notes: null,
        document_url: null,
        ...(existingRecord?.id ? { id: existingRecord.id } : {})
      };

      const serviceItemsData: Omit<ServiceItemInsert, 'service_record_id'>[] = serviceItems.map(item => {
        const cost = item.cost ? Number(item.cost) : null;
        const quantity = item.quantity ? Number(item.quantity) : 1;
        const partsArray = item.parts_replaced ? item.parts_replaced.split(',').map(part => part.trim()).filter(part => part.length > 0) : [];

        return {
          service_type: item.service_type || '',
          description: item.description || '',
          cost: cost,
          parts_replaced: partsArray.length > 0 ? partsArray : null,
          quantity: quantity,
          ...(typeof item.id === 'string' && item.id.startsWith('item_') ? {} : { id: item.id })
        };
      });

      onFormDataChange(serviceRecord, serviceItemsData);
    }
  }, [serviceDate, serviceProvider, mileage, serviceItems, vehicleId, existingRecord, onFormDataChange]);

  const handleItemChange = (index: number, field: keyof ServiceItemFormState, value: any) => {
    const newItems = [...serviceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setServiceItems(newItems);
  };

  const addItem = () => {
    setServiceItems([
      ...serviceItems,
      { id: newServiceItemId(), service_type: '', description: '', cost: '', parts_replaced: '', quantity: '1' }
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = serviceItems.filter((_, i) => i !== index);
    setServiceItems(newItems);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Service Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Date
            </label>
            <input 
              type="date" 
              value={serviceDate} 
              onChange={(e) => setServiceDate(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Provider
            </label>
            <input 
              type="text" 
              value={serviceProvider} 
              onChange={(e) => setServiceProvider(e.target.value)} 
              placeholder="Dealer, Shop, Self" 
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage
            </label>
            <input 
              type="number" 
              value={mileage} 
              onChange={(e) => setMileage(e.target.value)} 
              placeholder="Current odometer reading" 
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Service Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Service Items</h4>
          <button 
            onClick={addItem} 
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            + Add Service Item
          </button>
        </div>
        
        {/* Service Items List */}
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-4">
          {serviceItems.map((item, index) => (
            <div key={item.id} className="p-4 border border-gray-200 bg-white shadow-sm rounded-md">
              {/* First Line: Service Type and Description */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={item.service_type} 
                    onChange={(e) => handleItemChange(index, 'service_type', e.target.value)} 
                    placeholder="Oil Change" 
                    className="w-full p-2 border border-gray-300 rounded text-sm font-medium" 
                    required
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                    placeholder="Synthetic 5W-30" 
                    className="w-full p-2 border border-gray-300 rounded text-sm" 
                  />
                </div>
                {/* Remove Button */}
                <div className="flex-shrink-0">
                  {serviceItems.length > 1 && (
                    <button 
                      onClick={() => removeItem(index)} 
                      className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
                      title="Remove service item"
                    >
                      <span className="sr-only">Remove service item</span>
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Second Line: Parts Replaced, Quantity, and Cost */}
              <div className="flex items-center gap-3 ml-4 text-sm">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Parts Replaced</label>
                  <input 
                    type="text" 
                    value={item.parts_replaced} 
                    onChange={(e) => handleItemChange(index, 'parts_replaced', e.target.value)} 
                    placeholder="Oil filter, air filter" 
                    className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                    title="Comma-separated list of parts"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                    placeholder="1" 
                    className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Cost</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={item.cost} 
                    onChange={(e) => handleItemChange(index, 'cost', e.target.value)} 
                    placeholder="50.00" 
                    className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
