import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import type { MaintenanceRecord } from '../types';

const MaintenanceForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, vehicles, selectedVehicle, setSelectedVehicle, refreshMaintenanceRecords } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    service_type: '',
    service_date: new Date().toISOString().split('T')[0],
    description: '',
    mileage: selectedVehicle?.mileage || 0,
    service_provider: '',
    cost: 0,
    parts_replaced: [],
    is_recurring: false,
    next_service_date: '',
    next_service_mileage: 0,
    notes: '',
    vehicle_id: selectedVehicle?.id || '',
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && id) {
      fetchMaintenanceRecord(id);
    } else if (selectedVehicle) {
      setFormData(prev => ({
        ...prev,
        vehicle_id: selectedVehicle.id,
        mileage: selectedVehicle.mileage || 0,
      }));
    }
  }, [isEditMode, id, selectedVehicle]);

  const fetchMaintenanceRecord = async (recordId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (error) throw error;
      if (data) {
        // Format dates for form inputs
        const formattedData = {
          ...data,
          service_date: data.service_date ? new Date(data.service_date).toISOString().split('T')[0] : '',
          next_service_date: data.next_service_date ? new Date(data.next_service_date).toISOString().split('T')[0] : '',
        };
        
        setFormData(formattedData);
        
        // Set the selected vehicle
        if (data.vehicle_id) {
          const vehicle = vehicles.find(v => v.id === data.vehicle_id);
          if (vehicle) {
            setSelectedVehicle(vehicle);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching the maintenance record');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['mileage', 'cost', 'next_service_mileage'].includes(name)
        ? value === '' ? null : Number(value)
        : value,
    }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    setFormData(prev => ({ ...prev, vehicle_id: vehicleId }));
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      // Update mileage if it hasn't been changed yet or is 0
      if (!formData.mileage || formData.mileage === 0) {
        setFormData(prev => ({ ...prev, mileage: vehicle.mileage || 0 }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to perform this action');
      return;
    }
    
    if (!formData.vehicle_id) {
      setError('Please select a vehicle');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const maintenanceData = {
        ...formData,
        user_id: user.id,
      };
      
      if (isEditMode && id) {
        // Update existing record
        const { error } = await supabase
          .from('maintenance_records')
          .update(maintenanceData)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('maintenance_records')
          .insert(maintenanceData);
          
        if (error) throw error;
      }
      
      // Update vehicle mileage if the maintenance mileage is higher
      if (formData.vehicle_id && formData.mileage && selectedVehicle) {
        if (!selectedVehicle.mileage || formData.mileage > selectedVehicle.mileage) {
          const { error } = await supabase
            .from('vehicles')
            .update({ mileage: formData.mileage })
            .eq('id', formData.vehicle_id);
            
          if (error) throw error;
        }
      }
      
      // Refresh maintenance records and navigate back to list
      await refreshMaintenanceRecords();
      navigate('/maintenance');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while saving the maintenance record');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      navigate('/maintenance');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while deleting the maintenance record');
      }
    } finally {
      setLoading(false);
      setDeleteConfirm(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'Update maintenance or service information'
            : 'Record a new maintenance or service event'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="vehicle_id"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Vehicle
              </label>
              <div className="mt-2">
                <select
                  id="vehicle_id"
                  name="vehicle_id"
                  required
                  value={formData.vehicle_id || ''}
                  onChange={handleVehicleChange}
                  className="form-input"
                  disabled={isEditMode}
                >
                  <option value="" disabled>
                    Select a vehicle
                  </option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="service_type"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Service Type
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="service_type"
                  name="service_type"
                  required
                  value={formData.service_type || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Oil Change, Tire Rotation, etc."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="service_date"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Service Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  id="service_date"
                  name="service_date"
                  required
                  value={formData.service_date || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mileage"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Mileage at Service
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  min="0"
                  value={formData.mileage || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="service_provider"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Service Provider
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="service_provider"
                  name="service_provider"
                  value={formData.service_provider || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Mechanic or shop name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Cost ($)
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  min="0"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="parts_replaced"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Parts Replaced
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="parts_replaced"
                  name="parts_replaced"
                  value={formData.parts_replaced || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Oil filter, air filter, etc."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="warranty_info"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Warranty Information
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Warranty details if applicable"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="next_service_date"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Next Service Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  id="next_service_date"
                  name="next_service_date"
                  value={formData.next_service_date || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="next_service_mileage"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Next Service Mileage
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="next_service_mileage"
                  name="next_service_mileage"
                  min="0"
                  value={formData.next_service_mileage || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="notes"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Notes
              </label>
              <div className="mt-2">
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Additional details about the service"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {isEditMode && (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="btn-danger"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? isEditMode
                  ? 'Updating...'
                  : 'Adding...'
                : isEditMode
                ? 'Update Record'
                : 'Add Record'}
            </button>
          </div>
        </form>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Maintenance Record
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this maintenance record? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceForm;
