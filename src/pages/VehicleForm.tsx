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
    purchase_price: null,
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
      setError(null);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) {
        console.error('Error fetching vehicle:', error);
        throw error;
      }
      
      if (data) {
        console.log('Vehicle data fetched:', data);
        setFormData(data);
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      }
    } catch (error) {
      console.error('Fetch vehicle error:', error);
      if (error instanceof Error) {
        setError(`Error fetching vehicle: ${error.message}`);
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
      
      // Create a preview with proper error handling
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.readyState === FileReader.DONE) {
          setImagePreview(reader.result as string);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading image file');
        setError('Failed to preview the selected image. Please try another file.');
      };
      
      // Start reading after setting up handlers
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (vehicleId: string): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${vehicleId}.${fileExt}`;
      const filePath = `vehicles/${fileName}`;
      
      console.log('Uploading image to path:', filePath);
      
      // Check if the bucket exists first
      const { data: buckets } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      
      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, imageFile, { upsert: true });
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath);
      
      console.log('Image uploaded successfully, URL:', data.publicUrl);
      return data.publicUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      // Don't throw here, just return null so the vehicle can still be created
      return null;
    }
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
      
      // Make sure we have the required fields
      if (!formData.make || !formData.model || !formData.year) {
        setError('Make, model, and year are required');
        setLoading(false);
        return;
      }
      
      // Only include fields that exist in the actual database schema
      const vehicleData = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        color: formData.color || null,
        license_plate: formData.license_plate || null,
        vin: formData.vin || null,
        mileage: formData.mileage || null,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price || null,
        // Removed insurance_provider, insurance_policy, and notes as they don't exist in the schema
        user_id: user.id,
      };
      
      console.log('Submitting vehicle data:', vehicleData);
      
      let vehicleId = id;
      
      if (isEditMode && id) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id);
          
        if (updateError) {
          console.error('Error updating vehicle:', updateError);
          throw updateError;
        }
        
        console.log('Vehicle updated successfully');
      } else {
        // Create new vehicle
        const { data, error: insertError } = await supabase
          .from('vehicles')
          .insert([vehicleData]) // Ensure we're passing an array for insert
          .select('id')
          .single();
          
        if (insertError) {
          console.error('Error creating vehicle:', insertError);
          throw insertError;
        }
        
        if (!data) {
          throw new Error('No data returned from vehicle creation');
        }
        
        vehicleId = data.id;
        console.log('New vehicle created with ID:', vehicleId);
      }
      
      // Upload image if provided
      if (imageFile && vehicleId) {
        try {
          const imageUrl = await uploadImage(vehicleId);
          
          if (imageUrl) {
            console.log('Updating vehicle with image URL:', imageUrl);
            // Update vehicle with image URL
            const { error: updateError } = await supabase
              .from('vehicles')
              .update({ image_url: imageUrl })
              .eq('id', vehicleId);
              
            if (updateError) {
              console.error('Error updating vehicle with image URL:', updateError);
              // Don't throw here, we still want to continue even if image update fails
            }
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          // Don't throw here, we still want to continue even if image upload fails
        }
      }
      
      // Refresh the vehicles list and navigate back to vehicles page
      await refreshVehicles();
      navigate('/vehicles');
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error objects
        setError(`Error: ${JSON.stringify(error)}`);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'Update your vehicle information'
            : 'Enter your vehicle information'}
        </p>
      </div>

      <div className="bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl sm:p-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border-l-4 border-red-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
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
                      <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
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
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
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
                    ref={(input) => {
                      // This is used to programmatically click the file input
                      if (input) {
                        input.setAttribute('data-handler-attached', 'true');
                      }
                    }}
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
                  value={formData.make || ''}
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
                  value={formData.model || ''}
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
                  value={formData.year || new Date().getFullYear()}
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
                htmlFor="purchase_price"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Purchase Price
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="purchase_price"
                  name="purchase_price"
                  value={formData.purchase_price || ''}
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
