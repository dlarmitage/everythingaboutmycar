import { useState } from 'react';
import VehicleSelectorDropdown from '../components/VehicleSelectorDropdown';
import ServiceRecordModal from '../components/ServiceRecordModal';

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ServiceRecords() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedServiceRecordId, setSelectedServiceRecordId] = useState<string | null>(null);
  const { vehicles, refreshVehicles, user, refreshServiceRecords } = useApp();

  useEffect(() => {
    if (user && vehicles.length === 0) {
      refreshVehicles();
    }
  }, [user, vehicles.length, refreshVehicles]);

  const { serviceRecords, serviceItems } = useApp();
  
  // Filter service records by selected vehicle if one is selected
  const filteredRecords = selectedVehicleId 
    ? serviceRecords.filter(record => record.vehicle_id === selectedVehicleId)
    : serviceRecords;
  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Service Records</h1>
          <VehicleSelectorDropdown 
            onVehicleSelect={(vehicleId) => setSelectedVehicleId(vehicleId)} 
            selectedVehicleId={selectedVehicleId}
          />
        </div>
        <button
          className="rounded-full bg-blue-600 text-white w-10 h-10 flex items-center justify-center shadow-lg"
          onClick={() => {
            if (vehicles.length > 0 && !selectedVehicleId) {
              // If no vehicle is selected, select the first one
              setSelectedVehicleId(vehicles[0].id);
            }
            // Clear selected service record ID for new records
            setSelectedServiceRecordId(null);
            setModalOpen(true);
          }}
          aria-label="Add Service Record"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>
      {/* TODO: Vehicle switcher here */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="text-gray-400 text-center mt-20 col-span-full">No service records yet.</div>
        ) : (
          filteredRecords.map(record => {
            // Find service items for this record
            const recordItems = serviceItems.filter(item => item.service_record_id === record.id);
            const totalItems = recordItems.length;
            
            return (
              <div key={record.id} className="block rounded-lg bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] w-full min-w-[250px]">
                <div className="p-4">
                  <h5 className="mb-1 text-lg font-bold leading-tight text-neutral-800">
                    {new Date(record.service_date).toLocaleDateString()}
                  </h5>
                  <div className="mb-1 text-sm text-neutral-600">
                    {record.service_provider || 'No provider specified'}
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-400 break-all">
                      {record.mileage ? `${record.mileage} miles` : 'Mileage not recorded'}
                    </div>
                    <div className="text-sm font-medium">
                      {record.total_cost 
                        ? `$${record.total_cost.toFixed(2)}` 
                        : 'Cost not specified'}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-700 mb-2">
                      {totalItems} service {totalItems === 1 ? 'item' : 'items'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recordItems.slice(0, 3).map(item => (
                        <span key={item.id} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {item.service_type}
                        </span>
                      ))}
                      {totalItems > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-full">
                          +{totalItems - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <button 
                      onClick={() => {
                        // Open the service record modal for editing
                        setSelectedVehicleId(record.vehicle_id);
                        setSelectedServiceRecordId(record.id);
                        setModalOpen(true);
                      }}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedVehicleId && modalOpen && (
        <ServiceRecordModal 
          open={modalOpen} 
          onClose={() => {
            setModalOpen(false);
            // Clear selected service record ID when closing
            setSelectedServiceRecordId(null);
          }} 
          vehicleId={selectedVehicleId}
          serviceRecordId={selectedServiceRecordId || undefined}
          onSaveManualRecords={async (serviceRecord, serviceItems) => {
            try {
              let result;
              
              if (selectedServiceRecordId) {
                // Update existing record
                const { updateServiceRecord } = await import('../services/serviceRecordService');
                result = await updateServiceRecord(selectedServiceRecordId, serviceRecord, serviceItems);
              } else {
                // Create new record
                const { createServiceRecord } = await import('../services/serviceRecordService');
                result = await createServiceRecord(serviceRecord, serviceItems);
              }
              
              if (result) {
                // Refresh service records after successful save
                if (typeof refreshServiceRecords === 'function') {
                  await refreshServiceRecords();
                }
                setModalOpen(false);
                setSelectedServiceRecordId(null);
              }
              return Promise.resolve();
            } catch (error) {
              console.error('Error saving service record:', error);
              return Promise.reject(error);
            }
          }}
        />
      )}
    </div>
  );
}
