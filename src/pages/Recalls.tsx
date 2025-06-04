import React from 'react';
import VehicleSelectorDropdown from '../components/VehicleSelectorDropdown';

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Recalls() {
  // TODO: Get selected vehicle from context
  // TODO: Fetch recall info from API
  const recalls = [];
  const { vehicles, refreshVehicles, user } = useApp();

  useEffect(() => {
    if (user && vehicles.length === 0) {
      refreshVehicles();
    }
  }, [user, vehicles.length, refreshVehicles]);

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Recalls</h1>
        <VehicleSelectorDropdown />
      </div>
      {/* TODO: Recall list */}
      {recalls.length === 0 && <div className="text-gray-400 text-center mt-20">No recalls found.</div>}
    </div>
  );
}
