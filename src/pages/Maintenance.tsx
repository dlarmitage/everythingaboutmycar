import React from 'react';
import VehicleSelectorDropdown from '../components/VehicleSelectorDropdown';

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Maintenance() {
  // TODO: Get selected vehicle and odometer from context
  // TODO: Fetch PM items from API
  const pmItems = [];
  const { vehicles, refreshVehicles, user } = useApp();

  useEffect(() => {
    if (user && vehicles.length === 0) {
      refreshVehicles();
    }
  }, [user, vehicles.length, refreshVehicles]);

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Maintenance</h1>
        <VehicleSelectorDropdown />
      </div>
      {/* TODO: Odometer input and PM list */}
      {pmItems.length === 0 && <div className="text-gray-400 text-center mt-20">No maintenance items yet.</div>}
    </div>
  );
}
