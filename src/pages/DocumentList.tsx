import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import type { Document } from '../types/index';

const DocumentList = () => {
  const navigate = useNavigate();
  const { user, vehicles, selectedVehicle, setSelectedVehicle } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');

  // Document types for filtering
  const documentTypes = [
    'Insurance',
    'Registration',
    'Maintenance Record',
    'Warranty',
    'Purchase Agreement',
    'Recall Notice',
    'Inspection Report',
    'Other'
  ];

  useEffect(() => {
    if (user) {
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [user, selectedVehicle]);

  useEffect(() => {
    if (documents.length > 0) {
      applyFilters();
    }
  }, [documents, searchQuery, documentTypeFilter, selectedVehicle]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all documents for the user's vehicles
      let query = supabase
        .from('documents')
        .select('*');
        
      // If a specific vehicle is selected, filter by that vehicle
      if (selectedVehicle) {
        query = query.eq('vehicle_id', selectedVehicle.id);
      } else {
        // Otherwise, get documents for all vehicles owned by the user
        const vehicleIds = vehicles.map(v => v.id);
        if (vehicleIds.length > 0) {
          query = query.in('vehicle_id', vehicleIds);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDocuments(data);
        setFilteredDocuments(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching documents');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    // Filter by selected vehicle
    if (selectedVehicle) {
      filtered = filtered.filter(doc => doc.vehicle_id === selectedVehicle.id);
    }

    // Filter by document type
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === documentTypeFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.file_name?.toLowerCase().includes(query) ||
          getVehicleInfo(doc)?.toLowerCase().includes(query) ||
          doc.file_type?.toLowerCase().includes(query)
      );
    }

    setFilteredDocuments(filtered);
  };

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

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentTypeFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };



  const getDocumentIcon = (fileType: string) => {
    // Determine icon based on file type
    if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('image') || fileType.includes('jpeg') || fileType.includes('png')) {
      return '🖼️';
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return '📝';
    } else if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) {
      return '📊';
    } else if (fileType.includes('text')) {
      return '📃';
    } else {
      return '📎';
    }
  };

  const getVehicleInfo = (document: Document) => {
    const vehicle = vehicles.find(v => v.id === document.vehicle_id);
    if (vehicle) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.license_plate ? `(${vehicle.license_plate})` : ''}`;
    }
    return 'Unknown Vehicle';
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">
          Please log in to view your documents
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
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600">
          Manage and view all your vehicle-related documents
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
              <label htmlFor="document-type-filter" className="sr-only">
                Filter by Document Type
              </label>
              <select
                id="document-type-filter"
                className="form-input"
                value={documentTypeFilter}
                onChange={handleDocumentTypeChange}
              >
                <option value="all">All Document Types</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documents..."
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

        <div className="flex justify-end mb-6">
          <Link to="/documents/upload" className="btn-primary">
            Upload New Document
          </Link>
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
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
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || documentTypeFilter !== 'all' || selectedVehicle
                ? 'Try adjusting your filters or search query'
                : 'Get started by uploading a new document'}
            </p>
            {!searchQuery && documentTypeFilter === 'all' && !selectedVehicle && (
              <div className="mt-6">
                <Link to="/documents/upload" className="btn-primary">
                  Upload New Document
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Document
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Vehicle
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date Added
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg text-xl">
                          {getDocumentIcon(doc.file_type || '')}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{doc.file_name}</div>
                          <div className="text-gray-500 truncate max-w-xs">{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{doc.file_type || 'Unknown'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getVehicleInfo(doc)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <a
                        href={doc.file_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </a>
                      <Link
                        to={`/documents/${doc.id}`}
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

export default DocumentList;
