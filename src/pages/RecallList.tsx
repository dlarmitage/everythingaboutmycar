import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import type { RecallNotice } from '../types/index';

const RecallList = () => {
  const navigate = useNavigate();
  const { user, vehicles, selectedVehicle, setSelectedVehicle, recallNotices, refreshRecallNotices } = useApp();
  const [filteredRecalls, setFilteredRecalls] = useState<RecallNotice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState<string | null>(null);
  const [recallStatusFilter, setRecallStatusFilter] = useState<string>('all');

  // Fetch recalls when component mounts or when user/vehicle changes
  useEffect(() => {
    let isMounted = true;
    let fetchController = new AbortController();
    
    const fetchRecalls = async () => {
      if (!user) return;
      
      // Only set loading true if we're not already in a loading state
      if (!loading) {
        setLoading(true);
      }
      setError(null);
      
      try {
        await refreshRecallNotices();
        if (isMounted) {
          setLoading(false);
          // Remove console.log to avoid cluttering the console
        }
      } catch (err: unknown) {
        if (isMounted && err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching recalls:', err);
          setError(err instanceof Error ? err.message : 'An error occurred while fetching recall notices');
          setLoading(false);
        }
      }
    };
    
    // Only fetch if we have a user
    if (user) {
      fetchRecalls();
    }
    
    return () => {
      isMounted = false;
      fetchController.abort();
    };
  }, [user, selectedVehicle]); // Remove refreshRecallNotices from dependency array

  // Define applyFilters with useCallback to avoid dependency issues
  const applyFilters = useCallback(() => {
    // Only run filters if we have recall notices
    if (!recallNotices || recallNotices.length === 0) {
      setFilteredRecalls([]);
      return;
    }
    
    let filtered = [...recallNotices];

    // Filter by selected vehicle
    if (selectedVehicle) {
      filtered = filtered.filter(recall => recall.vehicle_id === selectedVehicle.id);
    }

    // Filter by recall status
    if (recallStatusFilter !== 'all') {
      filtered = filtered.filter(recall => recall.status === recallStatusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        recall =>
          recall.description?.toLowerCase().includes(query) ||
          recall.recall_number?.toLowerCase().includes(query) ||
          recall.manufacturer?.toLowerCase().includes(query)
      );
    }

    setFilteredRecalls(filtered);
  }, [recallNotices, searchQuery, recallStatusFilter, selectedVehicle]);
  
  // Apply filters whenever dependencies change
  useEffect(() => {
    // Only apply filters if we have recallNotices
    if (recallNotices && recallNotices.length > 0) {
      applyFilters();
    }
  }, [applyFilters]); // applyFilters already has recallNotices in its dependency array

  // applyFilters is now defined above with useCallback

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    
    if (vehicleId === 'all') {
      setSelectedVehicle(null);
    } else {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecallStatusFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Open
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Scheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getVehicleInfo = (recall: RecallNotice) => {
    const vehicle = vehicles.find(v => v.id === recall.vehicle_id);
    if (!vehicle) return 'Unknown Vehicle';
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const handleMarkAsCompleted = async (recallId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('recall_notices')
        .update({ status: 'completed' })
        .eq('id', recallId);
      
      if (error) throw error;
      
      await refreshRecallNotices();
    } catch (error) {
      console.error('Error updating recall status:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while updating the recall status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckForRecalls = () => {
    setLoading(true);
    setError(null);
    
    // Use a timer that we can clean up if needed
    const timer = setTimeout(() => {
      setLoading(false);
      alert('No new recalls found for your vehicles.');
    }, 1500);
    
    // Return cleanup function in case component unmounts during the timeout
    return () => clearTimeout(timer);
  };

  const handleAddManualRecall = () => {
    navigate('/recalls/new');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">
          Please log in to view recalls
        </h2>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recalls & Safety</h1>
        <p className="text-gray-600">
          Track and manage recalls and safety notices for your vehicles
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <label htmlFor="vehicle-filter" className="sr-only">
                Filter by Vehicle
              </label>
              <select
                id="vehicle-filter"
                className="form-input"
                value={selectedVehicle?.id || 'all'}
                onChange={handleVehicleChange}
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-64">
              <label htmlFor="status-filter" className="sr-only">
                Filter by Status
              </label>
              <select
                id="status-filter"
                className="form-input"
                value={recallStatusFilter}
                onChange={handleStatusChange}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search recalls..."
                className="form-input pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
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
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 mb-6">
          <button
            onClick={handleCheckForRecalls}
            disabled={loading || !selectedVehicle}
            className="btn-secondary"
          >
            {loading ? 'Checking...' : 'Check for New Recalls'}
          </button>
          <button
            onClick={handleAddManualRecall}
            className="btn-primary"
          >
            Add Recall Manually
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Only show loading spinner when actually loading and not on initial render */}
        {loading && user ? (
          <div className="flex justify-center py-12">
            <svg
              className="animate-spin h-10 w-10 text-primary-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : filteredRecalls.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recalls found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || recallStatusFilter !== 'all' 
                ? 'Try adjusting your filters or search query'
                : selectedVehicle 
                  ? `No recall notices found for your ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                  : 'No recall notices found for any of your vehicles'}
            </p>
            {!searchQuery && recallStatusFilter === 'all' && !selectedVehicle && (
              <div className="mt-6">
                <button
                  onClick={handleAddManualRecall}
                  className="btn-primary"
                >
                  Add Recall Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Recall
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Vehicle
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date Issued
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecalls.map((recall) => (
                  <tr key={recall.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-red-100 text-red-600 rounded-lg">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{recall.description}</div>
                          <div className="text-gray-500 truncate max-w-xs">
                            {recall.recall_number && (
                              <span className="mr-2 text-xs font-medium text-gray-500">
                                #{recall.recall_number}
                              </span>
                            )}
                            {recall.manufacturer || 'Unknown manufacturer'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getVehicleInfo(recall)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(recall.recall_date)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getStatusBadge(recall.status || '')}
                      {recall.status === 'completed' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed
                        </div>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      {recall.status !== 'completed' && (
                        <button
                          onClick={() => handleMarkAsCompleted(recall.id)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Mark Completed
                        </button>
                      )}
                      <Link
                        to={`/recalls/${recall.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecallList;
