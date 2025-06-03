import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import type { Vehicle, MaintenanceRecord, Document } from '../types';

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshVehicles, refreshMaintenanceRecords, refreshDocuments, setSelectedVehicle } = useApp();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVehicleData(id);
    }
  }, [id]);

  const fetchVehicleData = async (vehicleId: string) => {
    try {
      setLoading(true);
      
      // Fetch vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);
      
      // Set as selected vehicle in context
      setSelectedVehicle(vehicleData);

      // Fetch maintenance records and documents using context
      const fetchRecords = async () => {
        try {
          // Fetch maintenance records
          const { data: maintenanceData, error: maintenanceError } = await supabase
            .from('maintenance_records')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('service_date', { ascending: false });

          if (maintenanceError) throw maintenanceError;
          setMaintenanceRecords(maintenanceData || []);

          // Fetch documents
          const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false });

          if (documentError) throw documentError;
          setDocuments(documentData || []);
          
          // Also refresh context data
          await refreshMaintenanceRecords();
          await refreshDocuments();
        } catch (error) {
          console.error('Error fetching related records:', error);
        }
      };
      
      fetchRecords();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching vehicle data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!id || !vehicle) return;
    
    try {
      setLoading(true);
      
      // Delete related records first (maintenance, documents)
      const { error: maintenanceError } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('vehicle_id', id);
        
      if (maintenanceError) throw maintenanceError;
      
      const { error: documentError } = await supabase
        .from('documents')
        .delete()
        .eq('vehicle_id', id);
        
      if (documentError) throw documentError;
      
      // Delete the vehicle
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
        
      if (vehicleError) throw vehicleError;
      
      // Refresh vehicles and navigate back to list
      await refreshVehicles();
      navigate('/vehicles');
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while deleting the vehicle');
      }
    } finally {
      setLoading(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/vehicles" className="btn-primary">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Vehicle Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The vehicle you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/vehicles" className="btn-primary">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          {vehicle.license_plate && (
            <p className="text-gray-600">License: {vehicle.license_plate}</p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <Link
            to={`/vehicles/${id}/edit`}
            className="btn-secondary"
          >
            Edit Vehicle
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Vehicle
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this vehicle? This will also delete all maintenance records and documents associated with this vehicle. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vehicle Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="h-64 bg-gray-200">
              {vehicle.image_url ? (
                <img
                  src={vehicle.image_url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <svg
                    className="h-24 w-24 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Vehicle Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Make</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.make}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Model</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.model}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.year}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Color</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.color || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">License Plate</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.license_plate || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">VIN</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.vin || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Mileage</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Purchase Date</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {vehicle.purchase_date
                      ? new Date(vehicle.purchase_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Insurance Provider</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.insurance_provider || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Insurance Policy</h3>
                  <p className="mt-1 text-sm text-gray-900">{vehicle.insurance_policy || 'Not specified'}</p>
                </div>
              </div>
              {vehicle.notes && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{vehicle.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Maintenance Summary
              </h2>
              <Link
                to="/maintenance"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {maintenanceRecords.length > 0 ? (
              <div className="space-y-4">
                {maintenanceRecords.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-900">
                      {record.service_type}
                    </h3>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">
                        {new Date(record.service_date).toLocaleDateString()}
                      </span>
                      <span className="text-gray-500">
                        {record.mileage ? `${record.mileage.toLocaleString()} miles` : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {maintenanceRecords.length > 3 && (
                  <p className="text-center text-sm text-gray-500">
                    +{maintenanceRecords.length - 3} more records
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No maintenance records found
              </p>
            )}
            <div className="mt-4">
              <Link
                to="/maintenance/add"
                className="btn-primary w-full text-center"
              >
                Add Maintenance Record
              </Link>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-card p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Documents
              </h2>
              <Link
                to="/documents"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="bg-gray-200 p-2 rounded mr-3">
                      <svg
                        className="h-5 w-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/documents/${doc.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      View
                    </Link>
                  </div>
                ))}
                {documents.length > 3 && (
                  <p className="text-center text-sm text-gray-500">
                    +{documents.length - 3} more documents
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No documents uploaded yet
              </p>
            )}
            <div className="mt-4">
              <Link
                to="/documents/upload"
                className="btn-primary w-full text-center"
              >
                Upload Document
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
