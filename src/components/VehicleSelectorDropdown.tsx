import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid'; // Or your preferred icon
import { useApp } from '../context/AppContext';
import type { Vehicle } from '../types';

interface VehicleSelectorDropdownProps {
  // Optional callback when a vehicle is selected
  onVehicleSelect?: (vehicleId: string) => void;
  // Optional selected vehicle ID (if not using context)
  selectedVehicleId?: string | null;
}

export default function VehicleSelectorDropdown({ 
  onVehicleSelect, 
  selectedVehicleId 
}: VehicleSelectorDropdownProps = {}) {
  const { vehicles, selectedVehicle: contextSelectedVehicle, setSelectedVehicle, isLoading } = useApp();
  
  // Use the provided selectedVehicleId if available, otherwise use the context
  const selectedVehicle = selectedVehicleId !== undefined
    ? vehicles.find(v => v.id === selectedVehicleId) || null
    : contextSelectedVehicle;

  const getVehicleDisplayName = (vehicle: Vehicle | null) => {
    if (!vehicle) return 'Select Vehicle';
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  if (isLoading) {
    return (
      <div className="relative inline-block text-left">
        <button
          disabled
          className="inline-flex justify-center w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 shadow-sm cursor-not-allowed"
        >
          Loading vehicles...
        </button>
      </div>
    );
  }
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="relative inline-block text-left">
        <button
          disabled
          className="inline-flex justify-center w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 shadow-sm cursor-not-allowed"
        >
          No Vehicles Available
        </button>
      </div>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left w-64"> {/* Adjust width as needed */}
      <Menu.Button className="inline-flex justify-between items-center w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
        {getVehicleDisplayName(selectedVehicle)}
        <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {vehicles.map((vehicle) => (
              <Menu.Item key={vehicle.id}>
                {({ active }) => (
                  <button
                    onClick={() => {
                      // Update context if no external handler
                      if (!onVehicleSelect) {
                        setSelectedVehicle(vehicle);
                      } else {
                        // Call the external handler
                        onVehicleSelect(vehicle.id);
                      }
                    }}
                    className={[
                      'block w-full px-4 py-2 text-left text-sm',
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      selectedVehicle?.id === vehicle.id ? 'font-semibold bg-indigo-50' : ''
                    ].join(' ')}
                  >
                    {getVehicleDisplayName(vehicle)}
                    {selectedVehicle?.id === vehicle.id && <span className="ml-2">✓</span>}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
