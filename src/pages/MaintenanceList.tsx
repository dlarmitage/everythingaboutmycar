import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const MaintenanceList = () => {
  const { user, vehicles, selectedVehicle, setSelectedVehicle, maintenanceRecords, refreshMaintenanceRecords } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        try {
          await refreshMaintenanceRecords();
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('An error occurred while fetching maintenance records');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, selectedVehicle, refreshMaintenanceRecords]);



  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    if (vehicleId === '') {
      setSelectedVehicle(null);
    } else {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  };

  const filteredRecords = maintenanceRecords.filter((record) => {
    const searchMatches = searchTerm === '' || 
      record.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.service_provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const typeMatches = filterType === '' || record.service_type === filterType;
    
    return searchMatches && typeMatches;
  });

  // Get unique service types for filter
  const serviceTypes = Array.from(
    new Set(maintenanceRecords.map(record => record.service_type))
  ).sort();

  if (loading) {
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
          Sign in to view maintenance records
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          You need to be signed in to view and manage your maintenance records.
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Records</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track all maintenance and service history for your vehicles
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/maintenance/add" className="btn-primary">
            Add Record
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6 mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="vehicle-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Vehicle
            </label>
            <select
              id="vehicle-filter"
              className="form-input"
              value={selectedVehicle?.id || ''}
              onChange={handleVehicleChange}
            >
              <option value="">All Vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Service Type
            </label>
            <select
              id="type-filter"
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Records
            </label>
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
                id="search"
                className="form-input pl-10"
                placeholder="Search service type, provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-6 text-center">
          {searchTerm || filterType || selectedVehicle ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No matching records found
              </h2>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setSelectedVehicle(null);
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No maintenance records yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start tracking your vehicle maintenance by adding your first record.
              </p>
              <Link to="/maintenance/add" className="btn-primary">
                Add Maintenance Record
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {!selectedVehicle && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mileage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.service_date).toLocaleDateString()}
                    </td>
                    {!selectedVehicle && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const vehicle = vehicles.find(v => v.id === record.vehicle_id);
                          return vehicle ? (
                            <Link
                              to={`/vehicles/${vehicle.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </Link>
                          ) : (
                            'Unknown Vehicle'
                          );
                        })()}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.service_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.mileage ? record.mileage.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.service_provider || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/maintenance/${record.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/documents?maintenanceId=${record.id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Documents
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
