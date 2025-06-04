import { useState, useEffect } from 'react';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';

interface ManualServiceRecordFormProps {
  vehicleId: string;
  onSave: (record: ServiceRecordInsert, items: ServiceItemInsert[]) => void;
  onCancel: () => void;
  disabled?: boolean;
  existingRecord?: ServiceRecord | null;
  existingItems?: ServiceItem[] | null;
}

interface ServiceItemFormState {
  id: string;
  service_type: string;
  description: string;
  cost: string | number;
  parts_replaced: string;
  quantity: string | number;
  next_service_date: string;
  next_service_mileage: string | number;
}

const newServiceItemId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export default function ManualServiceRecordForm({ 
  vehicleId, 
  onSave, 
  onCancel, 
  disabled = false,
  existingRecord = null,
  existingItems = null
}: ManualServiceRecordFormProps) {
  const [serviceDate, setServiceDate] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [mileage, setMileage] = useState<number | string>('');
  const [serviceItems, setServiceItems] = useState<ServiceItemFormState[]>([
    { id: newServiceItemId(), service_type: '', description: '', cost: '', parts_replaced: '', quantity: '1', next_service_date: '', next_service_mileage: '' },
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
        next_service_date: item.next_service_date || '',
        next_service_mileage: item.next_service_mileage?.toString() || ''
      }));
      
      setServiceItems(formattedItems);
    }
  }, [existingRecord, existingItems]);

  const handleItemChange = (index: number, field: keyof ServiceItemFormState, value: any) => {
    const newItems = [...serviceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setServiceItems(newItems);
  };

  const addItem = () => {
    setServiceItems([
      ...serviceItems,
      { id: newServiceItemId(), service_type: '', description: '', cost: '', parts_replaced: '', quantity: '1', next_service_date: '', next_service_mileage: '' }
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = serviceItems.filter((_, i) => i !== index);
    setServiceItems(newItems);
  };

  const handleSave = () => {
    // Calculate total cost from all service items
    const totalCost = serviceItems.reduce((sum, item) => {
      const itemCost = item.cost ? Number(item.cost) : 0;
      const quantity = item.quantity ? Number(item.quantity) : 1;
      return sum + (itemCost * quantity);
    }, 0);

    // Create the service record object with the ID if we're editing an existing record
    const serviceRecord: ServiceRecordInsert = {
      vehicle_id: vehicleId,
      service_date: serviceDate,
      service_provider: serviceProvider || null,
      mileage: mileage ? Number(mileage) : null,
      total_cost: totalCost || null,
      notes: null,
      document_url: null,
      // If we're editing an existing record, include its ID
      ...(existingRecord?.id ? { id: existingRecord.id } : {})
    };

    // Create the service items (children)
    const serviceItemsData: ServiceItemInsert[] = serviceItems.map(item => {
      // Validate and convert values
      const cost = item.cost ? Number(item.cost) : null;
      const quantity = item.quantity ? Number(item.quantity) : 1;
      const next_service_mileage = item.next_service_mileage ? Number(item.next_service_mileage) : null;
      
      return {
        // service_record_id will be set by the backend after the service record is created
        // or use the existing record ID if we're editing
        service_record_id: existingRecord?.id || '', 
        service_type: item.service_type,
        description: item.description || null,
        cost,
        // Convert parts_replaced from string to string[] or null
        parts_replaced: item.parts_replaced ? item.parts_replaced.split(',').map(part => part.trim()) : null,
        quantity,
        next_service_date: item.next_service_date || null,
        next_service_mileage
      };
    });

    // Filter out any items with empty service_type
    const validItems = serviceItemsData.filter(item => item.service_type.trim() !== '');
    
    if (validItems.length === 0) {
      alert('Please add at least one service item with a service type');
      return;
    }

    onSave(serviceRecord, validItems);
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

      {/* Service Items Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Service Items</h4>
        </div>
        <div className="hidden md:grid md:grid-cols-12 gap-2 mb-1 text-xs font-medium text-gray-500 px-3">
          <div className="md:col-span-2">Service Type</div>
          <div className="md:col-span-2">Description</div>
          <div className="md:col-span-1">Qty</div>
          <div className="md:col-span-1">Cost</div>
          <div className="md:col-span-2">Parts Replaced</div>
          <div className="md:col-span-2">Next Service Date</div>
          <div className="md:col-span-1">Next Miles</div>
          <div className="md:col-span-1"></div>
        </div>
        
        {/* Grid Items - Scrollable Container */}
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-2">
          {serviceItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border border-gray-200 bg-white shadow-sm">
              {/* Service Type */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 md:hidden">Service Type</label>
                <input 
                  type="text" 
                  value={item.service_type} 
                  onChange={(e) => handleItemChange(index, 'service_type', e.target.value)} 
                  placeholder="Oil Change" 
                  className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                  required
                />
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 md:hidden">Description</label>
                <input 
                  type="text" 
                  value={item.description} 
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                  placeholder="Synthetic 5W-30" 
                  className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                />
              </div>
              {/* Quantity */}
              <div className="md:col-span-1">
                <label className="text-xs text-gray-600 md:hidden">Qty</label>
                <input 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                  placeholder="1" 
                  className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                />
              </div>
              {/* Cost */}
              <div className="md:col-span-1">
                <label className="text-xs text-gray-600 md:hidden">Cost</label>
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
              {/* Parts Replaced */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 md:hidden">Parts Replaced</label>
                <input 
                  type="text" 
                  value={item.parts_replaced} 
                  onChange={(e) => handleItemChange(index, 'parts_replaced', e.target.value)} 
                  placeholder="Oil filter, air filter" 
                  className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                  title="Comma-separated list of parts"
                />
              </div>
              {/* Next Service Date */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 md:hidden">Next Due Date</label>
                <input 
                  type="date" 
                  value={item.next_service_date} 
                  onChange={(e) => handleItemChange(index, 'next_service_date', e.target.value)} 
                  className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                />
              </div>
              {/* Next Service Mileage */}
              <div className="md:col-span-1">
                <label className="text-xs text-gray-600 md:hidden">Next Due Miles</label>
                <input 
                  type="number" 
                  value={item.next_service_mileage} 
                  onChange={(e) => handleItemChange(index, 'next_service_mileage', e.target.value)} 
                  placeholder="80000" 
                  className="w-full p-1.5 border border-gray-300 rounded text-sm" 
                />
              </div>
              {/* Remove Button */}
              <div className="md:col-span-1 flex items-center justify-end">
                {serviceItems.length > 1 && (
                  <button 
                    onClick={() => removeItem(index)} 
                    type="button"
                    className="p-1.5 text-red-500 hover:text-red-700 rounded text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={addItem} 
        type="button"
        className="mb-6 text-sm text-blue-600 hover:text-blue-800 font-medium py-1 px-3 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
      >
        + Add Service Item
      </button>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button 
          onClick={onCancel} 
          type="button"
          className="py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors disabled:opacity-50"
          disabled={disabled}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          type="button"
          className="py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors disabled:opacity-50"
          disabled={!serviceDate || serviceItems.length === 0 || disabled}
        >
          {disabled ? 'Saving...' : existingRecord ? 'Update Service Record' : 'Save Service Records'}
        </button>
      </div>
    </div>
  );
}
