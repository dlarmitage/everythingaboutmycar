import { createContext, useContext, useState } from 'react';

const VehicleContext = createContext<any>(null);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  // TODO: Add vehicles state and fetch logic
  return (
    <VehicleContext.Provider value={{ selectedVehicle, setSelectedVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicleContext() {
  return useContext(VehicleContext);
}
