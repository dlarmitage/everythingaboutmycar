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
        <h1 className="text-xl font-bold">Recalls</h1>
        <VehicleSelectorDropdown 
          onVehicleSelect={(vehicleId) => setSelectedVehicleId(vehicleId)}
        />
      </div>
      {/* TODO: Recall list */}
      {recalls.length === 0 && <div className="text-gray-400 text-center mt-20">No recalls found.</div>}
    </div>
  );
}
