import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUploader from '../components/DocumentUploader';
import { useApp } from '../context/AppContext';
import type { DocumentAnalysisResult, MaintenanceRecordInsert } from '../types/index';
import { supabase } from '../services/supabase';

const DocumentUpload = () => {
  const { selectedVehicle, vehicles, setSelectedVehicle, refreshMaintenanceRecords } = useApp();
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  };

  const handleAnalysisComplete = (result: DocumentAnalysisResult, docId: string) => {
    setAnalysisResult(result);
    setDocumentId(docId);
    setSaveError(null);
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || !selectedVehicle || !documentId) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // 1. Create maintenance record from analysis result
      if (analysisResult.maintenanceInfo) {
        const maintenanceRecord: MaintenanceRecordInsert = {
          vehicle_id: selectedVehicle.id,
          service_date: analysisResult.maintenanceInfo.serviceDate || new Date().toISOString().split('T')[0],
          service_type: analysisResult.maintenanceInfo.serviceType || 'Maintenance',
          description: analysisResult.maintenanceInfo.description || '',
          mileage: analysisResult.maintenanceInfo.mileage || null,
          cost: analysisResult.maintenanceInfo.cost || null,
          parts_replaced: Array.isArray(analysisResult.maintenanceInfo.partsReplaced) ? 
            analysisResult.maintenanceInfo.partsReplaced : [],
          service_provider: analysisResult.maintenanceInfo.serviceProvider || '',
          notes: analysisResult.maintenanceInfo.notes || '',
          next_service_date: analysisResult.maintenanceInfo.nextServiceDate || null,
          next_service_mileage: analysisResult.maintenanceInfo.nextServiceMileage || null,
          document_url: documentId ? `/documents/${documentId}` : null
        };
        
        const { error: maintenanceError } = await supabase
          .from('maintenance_records')
          .insert(maintenanceRecord);
          
        if (maintenanceError) {
          throw new Error(`Error creating maintenance record: ${maintenanceError.message}`);
        }
      }
      
      // 2. Update vehicle information if needed
      if (analysisResult.vehicleInfo && 
          (analysisResult.vehicleInfo.vin || analysisResult.vehicleInfo.licensePlate)) {
        
        const vehicleUpdates: any = {};
        
        // Only update fields that are empty in the vehicle record
        if (!selectedVehicle.vin && analysisResult.vehicleInfo.vin) {
          vehicleUpdates.vin = analysisResult.vehicleInfo.vin;
        }
        
        if (!selectedVehicle.license_plate && analysisResult.vehicleInfo.licensePlate) {
          vehicleUpdates.license_plate = analysisResult.vehicleInfo.licensePlate;
        }
        
        // Only update if we have changes to make
        if (Object.keys(vehicleUpdates).length > 0) {
          const { error: vehicleError } = await supabase
            .from('vehicles')
            .update(vehicleUpdates)
            .eq('id', selectedVehicle.id);
            
          if (vehicleError) {
            throw new Error(`Error updating vehicle information: ${vehicleError.message}`);
          }
        }
      }
      
      // 3. Update document record to mark it as processed
      const { error: documentError } = await supabase
        .from('documents')
        .update({ processed: true })
        .eq('id', documentId);
        
      if (documentError) {
        throw new Error(`Error updating document status: ${documentError.message}`);
      }
      
      // Refresh maintenance records and navigate
      await refreshMaintenanceRecords();
      navigate('/maintenance');
      
    } catch (error) {
      console.error('Error saving analysis:', error);
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateMaintenanceRecord = () => {
    if (!analysisResult?.maintenanceInfo || !selectedVehicle) return;
    
    // Navigate to maintenance form with pre-populated data
    navigate('/maintenance/add', { 
      state: { 
        prefill: {
          vehicle_id: selectedVehicle.id,
          service_date: analysisResult.maintenanceInfo.serviceDate,
          service_type: analysisResult.maintenanceInfo.serviceType,
          description: analysisResult.maintenanceInfo.description,
          mileage: analysisResult.maintenanceInfo.mileage,
          cost: analysisResult.maintenanceInfo.cost,
          parts_replaced: Array.isArray(analysisResult.maintenanceInfo.partsReplaced) ? 
            analysisResult.maintenanceInfo.partsReplaced : [],
          service_provider: analysisResult.maintenanceInfo.serviceProvider,
          notes: analysisResult.maintenanceInfo.notes,
          next_service_date: analysisResult.maintenanceInfo.nextServiceDate,
          next_service_mileage: analysisResult.maintenanceInfo.nextServiceMileage,
          document_id: documentId
        } 
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-gray-600">
          Upload vehicle documents to analyze and store information
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            No Vehicles Found
          </h2>
          <p className="text-gray-600 mb-6">
            You need to add a vehicle before uploading documents.
          </p>
          <button
            onClick={() => navigate('/vehicles/add')}
            className="btn-primary"
          >
            Add Vehicle
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="mb-6">
            <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 mb-1">
              Select Vehicle
            </label>
            <select
              id="vehicle"
              className="form-input"
              value={selectedVehicle?.id || ''}
              onChange={handleVehicleChange}
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

          {selectedVehicle ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Document
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a maintenance record, service invoice, or other vehicle document.
                  We'll analyze it and extract the relevant information.
                </p>
                <DocumentUploader onAnalysisComplete={handleAnalysisComplete} />
              </div>

              {analysisResult && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Analysis Results
                  </h3>
                  
                  {analysisResult.vehicleInfo && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">
                        Vehicle Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(analysisResult.vehicleInfo).map(([key, value]) => (
                            <div key={key} className="flex">
                              <dt className="text-sm font-medium text-gray-500 mr-2 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </dt>
                              <dd className="text-sm text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.maintenanceInfo && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">
                        Maintenance Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(analysisResult.maintenanceInfo).map(([key, value]) => {
                            if (key === 'partsReplaced' && Array.isArray(value)) {
                              return (
                                <div key={key} className="flex sm:col-span-2">
                                  <dt className="text-sm font-medium text-gray-500 mr-2 capitalize">
                                    Parts Replaced:
                                  </dt>
                                  <dd className="text-sm text-gray-900">
                                    {value.join(', ')}
                                  </dd>
                                </div>
                              );
                            }
                            return (
                              <div key={key} className="flex">
                                <dt className="text-sm font-medium text-gray-500 mr-2 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </dt>
                                <dd className="text-sm text-gray-900">{value}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.recallInfo && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">
                        Recall Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(analysisResult.recallInfo).map(([key, value]) => (
                            <div key={key} className="flex">
                              <dt className="text-sm font-medium text-gray-500 mr-2 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </dt>
                              <dd className="text-sm text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    {saveError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {saveError}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setAnalysisResult(null)}
                        disabled={isSaving}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCreateMaintenanceRecord}
                        disabled={isSaving || !analysisResult?.maintenanceInfo}
                      >
                        Edit & Create Maintenance Record
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSaveAnalysis}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Information'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Please select a vehicle to upload documents
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
