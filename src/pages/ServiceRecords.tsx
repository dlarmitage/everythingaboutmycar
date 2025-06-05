import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ServiceRecordModal from '../components/ServiceRecordModal';
import VehicleSelectorDropdown from '../components/VehicleSelectorDropdown';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ServiceRecords() {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedServiceRecordId, setSelectedServiceRecordId] = useState<string | null>(null);
  const { vehicles, refreshVehicles, user, refreshServiceRecords, setSelectedVehicle } = useApp();

  useEffect(() => {
    if (user && vehicles.length === 0) {
      refreshVehicles();
    }
  }, [user, vehicles.length, refreshVehicles]);

  const { serviceRecords, serviceItems } = useApp();
  
  // Initialize from URL params on first load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vehicleId = params.get('vehicleId');
    
    if (vehicleId) {
      console.log(`Found vehicle ID in URL: ${vehicleId}`);
      setSelectedVehicleId(vehicleId);
      
      // Also update the global context
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  }, [location.search, vehicles, setSelectedVehicle]);
  
  // Update URL when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId) {
      console.log(`Updating URL with vehicle ID: ${selectedVehicleId}`);
      navigate(`/service-records?vehicleId=${selectedVehicleId}`, { replace: true });
    } else {
      navigate('/service-records', { replace: true });
    }
  }, [selectedVehicleId, navigate]);
  
  // Filter service records by selected vehicle if one is selected
  const filteredRecords = selectedVehicleId 
    ? serviceRecords.filter(record => record.vehicle_id === selectedVehicleId)
    : serviceRecords;
    
  // Debug log the filtered records once when they change
  useEffect(() => {
    if (selectedVehicleId && filteredRecords.length > 0) {
      console.log(`Found ${filteredRecords.length} records for vehicle ${selectedVehicleId}`);
    }
  }, [filteredRecords.length, selectedVehicleId]);
  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Service Records</h1>
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border ${selectedVehicleId ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}`}
            onClick={() => {
              // Only open modal if a vehicle is selected
              if (selectedVehicleId) {
                // Clear selected service record ID for new records
                setSelectedServiceRecordId(null);
                setModalOpen(true);
              }
            }}
            disabled={!selectedVehicleId}
            aria-label="Add Service Record"
            title={selectedVehicleId ? 'Add Service Record' : 'Select a vehicle first'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <VehicleSelectorDropdown 
          onVehicleSelect={(vehicleId) => setSelectedVehicleId(vehicleId)} 
          selectedVehicleId={selectedVehicleId}
        />
      </div>
      {/* Service records grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!selectedVehicleId ? (
          <div className="text-gray-400 text-center mt-20 col-span-full">Please select a vehicle to view service records.</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-gray-400 text-center mt-20 col-span-full">No service records yet for this vehicle.</div>
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
                
                // Return the saved record for document linking
                return result.record;  
              }
              return null;
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
