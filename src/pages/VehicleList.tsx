import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const VehicleList = () => {
  const { user, vehicles, refreshVehicles, isLoading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshVehicles();
  }, [refreshVehicles]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchString = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.license_plate || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sign in to view your vehicles
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          You need to be signed in to view and manage your vehicles.
        </p>
        <Link to="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all your vehicles in one place
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/vehicles/add" className="btn-primary">
            Add Vehicle
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-6 text-center">
          {searchTerm ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No vehicles found
              </h2>
              <p className="text-gray-600 mb-6">
                No vehicles match your search criteria. Try a different search or add a new vehicle.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No vehicles yet
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't added any vehicles yet. Add your first vehicle to start tracking.
              </p>
            </>
          )}
          <Link to="/vehicles/add" className="btn-primary">
            Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-lg shadow-card overflow-hidden w-full min-w-[250px]"
            >
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                {vehicle.image_url ? (
                  <img
                    src={vehicle.image_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-20 w-20 text-gray-400"
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
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <div className="mt-2 space-y-2">
                  {vehicle.license_plate && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">License:</span>{' '}
                      {vehicle.license_plate}
                    </p>
                  )}
                  {vehicle.vin && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">VIN:</span> {vehicle.vin}
                    </p>
                  )}
                  {vehicle.color && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Color:</span> {vehicle.color}
                    </p>
                  )}
                  {vehicle.mileage && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Mileage:</span>{' '}
                      {vehicle.mileage.toLocaleString()} miles
                    </p>
                  )}
                </div>
                <div className="mt-6 flex justify-between">
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/vehicles/${vehicle.id}/edit`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
