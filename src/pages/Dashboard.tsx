import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const { user, vehicles, selectedVehicle, setSelectedVehicle, isLoading } = useApp();
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);

  useEffect(() => {
    // This would fetch upcoming maintenance and recent documents
    // For now, we'll use placeholder data
    if (selectedVehicle) {
      setUpcomingMaintenance([
        {
          id: '1',
          service_type: 'Oil Change',
          next_service_date: '2025-07-15',
          next_service_mileage: 75000,
        },
        {
          id: '2',
          service_type: 'Tire Rotation',
          next_service_date: '2025-08-10',
          next_service_mileage: 76000,
        },
      ]);

      setRecentDocuments([
        {
          id: '1',
          file_name: 'oil_change_receipt.pdf',
          created_at: '2025-05-15T10:30:00Z',
        },
        {
          id: '2',
          file_name: 'inspection_report.jpg',
          created_at: '2025-04-20T14:45:00Z',
        },
      ]);
    }
  }, [selectedVehicle]);

  // Add debug logging
  useEffect(() => {
    console.log('Dashboard rendered with user:', user);
    console.log('isLoading:', isLoading);
  }, [user, isLoading]);

  if (isLoading) {
    console.log('Dashboard showing loading state');
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('Dashboard showing welcome screen (no user)');
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Everything About My Car
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Keep track of all your vehicle information in one place. Import documents, track maintenance, and stay on top of recalls.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
          <Link to="/register" className="btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  console.log('Dashboard showing authenticated view for user:', user?.email);
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user.first_name || user.email.split('@')[0]}
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Get Started
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't added any vehicles yet. Add your first vehicle to start tracking.
          </p>
          <Link to="/vehicles/add" className="btn-primary">
            Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle Selector */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Vehicles
            </h2>
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-4 rounded-md cursor-pointer transition-colors ${
                    selectedVehicle?.id === vehicle.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      {vehicle.license_plate && (
                        <p className="text-sm text-gray-500">
                          {vehicle.license_plate}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/vehicles/${vehicle.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
              <Link
                to="/vehicles/add"
                className="block text-center py-2 px-4 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400"
              >
                + Add Another Vehicle
              </Link>
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Maintenance
              </h2>
              <Link
                to="/maintenance"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {upcomingMaintenance.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-900">
                      {item.service_type}
                    </h3>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">
                        Due: {new Date(item.next_service_date).toLocaleDateString()}
                      </span>
                      <span className="text-gray-500">
                        or at {item.next_service_mileage.toLocaleString()} miles
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No upcoming maintenance scheduled
              </p>
            )}
            <div className="mt-4">
              <Link
                to="/maintenance/add"
                className="btn-primary w-full text-center"
              >
                Add Maintenance Record
              </Link>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-lg shadow-card p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Documents
              </h2>
              <Link
                to="/documents"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {recentDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-gray-50 rounded-md border border-gray-200 flex items-center"
                  >
                    <div className="bg-gray-200 p-2 rounded mr-3">
                      <svg
                        className="h-6 w-6 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/documents/${doc.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No documents uploaded yet
              </p>
            )}
            <div className="mt-4">
              <Link
                to="/documents/upload"
                className="btn-primary w-full text-center"
              >
                Upload Document
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
