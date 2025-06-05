import VehicleCard from '../components/VehicleCard';
import VehicleDetailsModal from '../components/VehicleDetailsModal';
import VehicleModal from '../components/VehicleModal';
import ServiceRecordModal from '../components/ServiceRecordModal';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { createServiceRecord } from '../services/serviceRecordService';
import type { Vehicle, ServiceRecordInsert, ServiceItemInsert, ServiceRecord } from '../types';


export default function Vehicles() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();
  const [serviceRecordModalOpen, setServiceRecordModalOpen] = useState(false);
  const [currentVehicleIdForService, setCurrentVehicleIdForService] = useState<string | null>(null);
  const { refreshServiceRecords } = useApp();

  // Fetch vehicles from Supabase
  const fetchVehicles = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Add vehicle to Supabase (FAB or separate modal, not details modal)
  // (If you want to keep add functionality, you can add a separate modal for it)

  // Save changes from details modal
  const handleSave = async (vehicle: Vehicle) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updateData = { ...vehicle, user_id: user.id };
      const { error } = await supabase.from('vehicles').update(updateData).eq('id', vehicle.id);
      if (error) throw error;
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Error saving vehicle');
    } finally {
      setLoading(false);
      setDetailsOpen(false);
      setSelectedVehicle(null);
    }
  };

  // Add vehicle from VehicleModal
  const handleAddVehicle = async (vehicle: any) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const insertData = {
        ...vehicle,
        user_id: user.id,
      };
      const { error } = await supabase.from('vehicles').insert(insertData);
      if (error) throw error;
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Error adding vehicle');
    } finally {
      setLoading(false);
      setAddOpen(false);
    }
  };

  // Delete vehicle from details modal
  const handleDelete = async (vehicle: Vehicle) => {
    if (!user) return;
    if (!window.confirm(`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicle.id);
      if (error) throw error;
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Error deleting vehicle');
    } finally {
      setLoading(false);
      setDetailsOpen(false);
      setSelectedVehicle(null);
    }
  };

  // Open details modal
  const handleDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailsOpen(true);
  };

  // Open Service Record Modal
  const handleOpenServiceRecordModal = (vehicleId: string) => {
    setCurrentVehicleIdForService(vehicleId);
    setServiceRecordModalOpen(true);
  };

  const handleCloseServiceRecordModal = () => {
    setServiceRecordModalOpen(false);
    setCurrentVehicleIdForService(null);
  };

  // Save manually entered service records using the new schema
  const handleSaveManualServiceRecords = async (
    serviceRecord: ServiceRecordInsert,
    serviceItems: ServiceItemInsert[]
  ): Promise<ServiceRecord | null> => {
    if (!user || !currentVehicleIdForService) {
      setError('User or Vehicle ID is missing. Cannot save service records.');
      return null;
    }
    
    // Validate service items
    if (!serviceItems.length) {
      setError('At least one service item is required');
      return null;
    }
    
    // Check for required fields
    if (!serviceRecord.service_date) {
      setError('Service date is required');
      return null;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Make sure the vehicle_id is set correctly
      const recordToInsert: ServiceRecordInsert = {
        ...serviceRecord,
        vehicle_id: currentVehicleIdForService
      };

      // Remove service_record_id from items as it will be assigned by the service
      const itemsToInsert = serviceItems.map(item => {
        // Create a new object without service_record_id
        const { service_record_id, ...rest } = item;
        return rest;
      });

      // Use the service function to create the record and items
      const result = await createServiceRecord(recordToInsert, itemsToInsert);
      
      if (!result) {
        throw new Error('Failed to create service record');
      }

      // Refresh service records in the app context
      if (typeof refreshServiceRecords === 'function') {
        await refreshServiceRecords();
      }
      
      console.log('Service record saved successfully!');
      
      // Close the modal only on success
      handleCloseServiceRecordModal();
      
      // Return the created record
      return result.record;
    } catch (err: any) {
      setError(err.message || 'Error saving service record');
      console.error('Error saving service record:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My Vehicles</h1>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => setAddOpen(true)}
          aria-label="Add Vehicle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading vehicles...</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {vehicles.length === 0 && <div className="text-gray-400 text-center mt-20">No vehicles yet.</div>}
          {vehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onDetails={handleDetails}
              onOpenServiceRecordModal={handleOpenServiceRecordModal} // Pass the handler
            />
          ))}
        </div>
      )}
      <VehicleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAddVehicle={handleAddVehicle}
      />
      <VehicleDetailsModal
        open={detailsOpen}
        vehicle={selectedVehicle}
        onClose={() => { setDetailsOpen(false); setSelectedVehicle(null); }}
        onSave={handleSave}
        onDelete={handleDelete} // onDelete was correctly here in my previous understanding, re-confirming its presence.
      />
      {/* Service Record Modal - ensure vehicleId is not null when modal is open */}
      {currentVehicleIdForService && serviceRecordModalOpen && (
        <ServiceRecordModal 
          open={serviceRecordModalOpen}
          onClose={handleCloseServiceRecordModal}
          vehicleId={currentVehicleIdForService}
          onSaveManualRecords={handleSaveManualServiceRecords}
          onDelete={async (serviceRecordId) => {
            try {
              // Close the modal after successful deletion
              handleCloseServiceRecordModal();
              // Note: Vehicle list doesn't need refresh since service records are not displayed here
            } catch (error) {
              console.error('Error after service record deletion:', error);
            }
          }}
        />
      )}
    </div>
  );
}
