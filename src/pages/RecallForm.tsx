import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import type { RecallNotice } from '../types/index';

const RecallForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, selectedVehicle, setSelectedVehicle, refreshRecallNotices } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<Partial<RecallNotice>>({
    recall_number: '',
    recall_date: new Date().toISOString().split('T')[0],
    description: '',
    severity: 'medium',
    manufacturer: '',
    affected_components: [],
    remedy: '',
    status: 'open',
    notes: '',
    vehicle_id: selectedVehicle?.id || '',
  });

  useEffect(() => {
    if (id) {
      fetchRecallData(id);
    }
  }, [id]);

  useEffect(() => {
    if (!id && selectedVehicle) {
      setFormData(prev => ({
        ...prev,
        vehicle_id: selectedVehicle.id,
        manufacturer: selectedVehicle.make
      }));
    }
  }, [selectedVehicle, id]);

  const fetchRecallData = async (recallId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('recall_notices')
        .select('*')
        .eq('id', recallId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData(data);
        
        // Set selected vehicle based on recall data
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
        setError('An error occurred while fetching recall data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const componentsText = e.target.value;
    const componentsArray = componentsText.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, affected_components: componentsArray }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    setFormData(prev => ({ ...prev, vehicle_id: vehicleId }));
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData(prev => ({ ...prev, manufacturer: vehicle.make }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id) {
      setError('Please select a vehicle');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const recallData = {
        ...formData,
        affected_components: formData.affected_components || [],
      };

      let result;
      
      if (id) {
        // Update existing recall
        result = await supabase
          .from('recall_notices')
          .update(recallData)
          .eq('id', id);
      } else {
        // Insert new recall
        result = await supabase
          .from('recall_notices')
          .insert(recallData);
      }

      if (result.error) throw result.error;
      
      // Refresh recall notices and navigate back to list
      await refreshRecallNotices();
      navigate('/recalls');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while saving the recall');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('recall_notices')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh recall notices and navigate back to list
      await refreshRecallNotices();
      navigate('/recalls');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while deleting the recall');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Recall Notice' : 'Add Recall Notice'}
          </h1>
          {id && (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recall Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the details of the recall notice.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">
                <div>
                  <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
                    Vehicle
                  </label>
                  <div className="mt-1">
                    <select
                      id="vehicle_id"
                      name="vehicle_id"
                      value={formData.vehicle_id || ''}
                      onChange={handleVehicleChange}
                      className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select a vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Recall Description
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., Brake System Recall"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="recall_number" className="block text-sm font-medium text-gray-700">
                    Recall Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="recall_number"
                      name="recall_number"
                      value={formData.recall_number || ''}
                      onChange={handleInputChange}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., 21V-123"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="recall_date" className="block text-sm font-medium text-gray-700">
                    Recall Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="recall_date"
                      name="recall_date"
                      value={formData.recall_date || ''}
                      onChange={handleInputChange}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                    Manufacturer
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer || ''}
                      onChange={handleInputChange}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., Toyota"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="affected_components" className="block text-sm font-medium text-gray-700">
                    Affected Components (comma-separated)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="affected_components"
                      name="affected_components"
                      value={formData.affected_components?.join(', ') || ''}
                      onChange={handleComponentsChange}
                      className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="e.g., Brakes, Steering, Airbags"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                    Severity
                  </label>
                  <div className="mt-1">
                    <select
                      id="severity"
                      name="severity"
                      value={formData.severity || 'medium'}
                      onChange={handleInputChange}
                      className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="remedy" className="block text-sm font-medium text-gray-700">
                    Remedy
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="remedy"
                      name="remedy"
                      value={formData.remedy || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="form-textarea block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="What will be done to fix the issue"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <select
                      id="status"
                      name="status"
                      value={formData.status || 'open'}
                      onChange={handleInputChange}
                      className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="open">Open</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="form-textarea block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Additional notes or comments"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/recalls')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Saving...' : id ? 'Update Recall' : 'Add Recall'}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this recall notice? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecallForm;
