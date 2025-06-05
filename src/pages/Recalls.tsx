import { useState, useEffect } from 'react';
import VehicleSelectorDropdown from '../components/VehicleSelectorDropdown';
import { useApp } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Recalls() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // TODO: Fetch recall info from API
  const recalls = [];
  const { vehicles, refreshVehicles, user, setSelectedVehicle } = useApp();

  useEffect(() => {
    if (user && vehicles.length === 0) {
      refreshVehicles();
    }
  }, [user, vehicles.length, refreshVehicles]);
  
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
      navigate(`/recalls?vehicleId=${selectedVehicleId}`, { replace: true });
    } else {
      navigate('/recalls', { replace: true });
    }
  }, [selectedVehicleId, navigate]);

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Recalls</h1>
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border ${selectedVehicleId ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}`}
            onClick={() => {
              // TODO: Open recall search/add modal
              if (selectedVehicleId) {
                console.log('Check recalls for vehicle:', selectedVehicleId);
              }
            }}
            disabled={!selectedVehicleId}
            aria-label="Check Recalls"
            title={selectedVehicleId ? 'Check Recalls' : 'Select a vehicle first'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <VehicleSelectorDropdown 
          onVehicleSelect={(vehicleId) => setSelectedVehicleId(vehicleId)}
        />
      </div>
      {/* TODO: Recall list */}
      {recalls.length === 0 && <div className="text-gray-400 text-center mt-20">No recalls found.</div>}
    </div>
  );
}
