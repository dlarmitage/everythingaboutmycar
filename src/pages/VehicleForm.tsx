import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import type { Vehicle } from '../types/index';

const VehicleForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshVehicles } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    vin: '',
    mileage: 0,
    purchase_date: '',
    insurance_provider: '',
    insurance_policy: '',
    notes: '',
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && id) {
      fetchVehicle(id);
    }
  }, [isEditMode, id]);

  const fetchVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching the vehicle');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (vehicleId: string): Promise<string | null> => {
    if (!imageFile) return null;
    
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${vehicleId}.${fileExt}`;
    const filePath = `vehicles/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(filePath, imageFile, { upsert: true });
    
    if (uploadError) {
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to perform this action');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const vehicleData = {
        ...formData,
        user_id: user.id,
      };
      
      let vehicleId = id;
      
      if (isEditMode && id) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Create new vehicle
        const { data, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select('id')
          .single();
          
        if (error) throw error;
        vehicleId = data.id;
      }
      
      // Upload image if provided
      if (imageFile && vehicleId) {
        const imageUrl = await uploadImage(vehicleId);
        
        if (imageUrl) {
          // Update vehicle with image URL
          const { error } = await supabase
            .from('vehicles')
            .update({ image_url: imageUrl })
            .eq('id', vehicleId);
            
          if (error) throw error;
        }
      }
      
      // Refresh vehicles and navigate back to list
      await refreshVehicles();
      navigate('/vehicles');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while saving the vehicle');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'Update your vehicle information'
            : 'Add a new vehicle to your account'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="image"
                className="block text-sm font-medium leading-6 text-gray-900 mb-1"
              >
                Vehicle Image
              </label>
              <div className="mt-2 flex items-center gap-x-3">
                {imagePreview ? (
                  <div className="relative h-40 w-40 overflow-hidden rounded-md">
                    <img
                      src={imagePreview}
                      alt="Vehicle preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                    >
                      <svg
                        className="h-5 w-5 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="h-40 w-40 flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                    <svg
                      className="h-12 w-12 text-gray-400"
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
                  </div>
                )}
                <div className="ml-4">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <label
                    htmlFor="image"
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    {imagePreview ? 'Change image' : 'Upload image'}
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG or GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="make"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Make
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="make"
                  name="make"
                  required
                  value={formData.make}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Model
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Year
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="year"
                  name="year"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                  value={formData.year}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="color"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Color
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="license_plate"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                License Plate
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="license_plate"
                  name="license_plate"
                  value={formData.license_plate || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="vin"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                VIN
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mileage"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Current Mileage
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  min="0"
                  value={formData.mileage || 0}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="purchase_date"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Purchase Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  id="purchase_date"
                  name="purchase_date"
                  value={formData.purchase_date || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="insurance_provider"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Insurance Provider
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="insurance_provider"
                  name="insurance_provider"
                  value={formData.insurance_provider || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="insurance_policy"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Insurance Policy Number
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="insurance_policy"
                  name="insurance_policy"
                  value={formData.insurance_policy || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="notes"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Notes
              </label>
              <div className="mt-2">
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? isEditMode
                  ? 'Updating...'
                  : 'Adding...'
                : isEditMode
                ? 'Update Vehicle'
                : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;
