import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ImageUploadModal from './ImageUploadModal';
import { useApp } from '../context/AppContext';
import { updateVehicleImage } from '../services/vehicleService';
import type { Vehicle } from '../types';

const VEHICLE_PLACEHOLDER = 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/car.svg';

interface VehicleCardProps {
  vehicle: Vehicle;
  onDetails: (vehicle: Vehicle) => void;
  onOpenServiceRecordModal: (vehicleId: string) => void;
}

// Separate component for the vehicle image that can be independently updated
function VehicleImage({ imageUrl, make, model, onImageClick }: {
  imageUrl: string;
  make: string;
  model: string;
  onImageClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Reset image error when imageUrl changes
    setImageError(false);
  }, [imageUrl]);
  
  // Get a brand-specific placeholder based on the make
  const getBrandPlaceholder = () => {
    const makeFormatted = make?.toLowerCase() || '';
    if (makeFormatted.includes('ford')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/ford.svg';
    } else if (makeFormatted.includes('jeep') || makeFormatted.includes('chrysler') || 
               makeFormatted.includes('dodge') || makeFormatted.includes('ram')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/chrysler.svg';
    } else if (makeFormatted.includes('subaru')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/subaru.svg';
    } else if (makeFormatted.includes('toyota')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/toyota.svg';
    } else if (makeFormatted.includes('honda')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/honda.svg';
    } else if (makeFormatted.includes('chevrolet') || makeFormatted.includes('chevy') || 
               makeFormatted.includes('gmc')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/chevrolet.svg';
    } else if (makeFormatted.includes('bmw')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/bmw.svg';
    } else if (makeFormatted.includes('audi')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/audi.svg';
    } else if (makeFormatted.includes('mercedes') || makeFormatted.includes('benz')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/mercedes.svg';
    } else if (makeFormatted.includes('volkswagen') || makeFormatted.includes('vw')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/volkswagen.svg';
    } else if (makeFormatted.includes('volvo')) {
      return 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/volvo.svg';
    } else {
      return VEHICLE_PLACEHOLDER;
    }
  };
  
  // Check if the URL is valid (not null, undefined, or empty)
  const isValidUrl = imageUrl && imageUrl !== VEHICLE_PLACEHOLDER;
  
  // Process the image URL to ensure it works correctly with Supabase storage
  const processedImageUrl = useMemo(() => {
    if (!isValidUrl) return imageUrl;
    
    // Always route through our proxy endpoint for consistent handling
    // Make sure the URL is properly encoded
    console.log('Processing vehicle image URL:', imageUrl);
    return `http://localhost:3005/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }, [imageUrl, isValidUrl]);
  
  return (
    <div className="relative">
      {isValidUrl && !imageError ? (
        <img
          className="rounded-t-lg w-full h-48 object-cover"
          src={processedImageUrl}
          alt={`${make} ${model}`}
          onError={(_: React.SyntheticEvent<HTMLImageElement, Event>) => {
            // Log error but don't include the event object itself
            console.error(`Error loading image for ${make} ${model} with URL: ${processedImageUrl}`);
            // Set error state to trigger fallback
            setImageError(true);
          }}
          loading="lazy"
        />
      ) : (
        <div className="rounded-t-lg w-full h-48 flex items-center justify-center bg-gray-100">
          <img 
            src={getBrandPlaceholder()} 
            alt={`${make} ${model} logo`}
            onError={() => {
              console.error(`Error loading brand placeholder for ${make}`);
            }}
            className="h-24 w-24"
          />
        </div>
      )}
      <button 
        onClick={onImageClick}
        className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 focus:outline-none"
        aria-label="Change image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function VehicleCard({ vehicle, onDetails, onOpenServiceRecordModal }: VehicleCardProps) {
  const { setSelectedVehicle, refreshVehicles, selectedVehicle } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedImageUrl, setUpdatedImageUrl] = useState<string | null>(null);
  const location = useLocation();
  
  // Check if this vehicle is selected either in the app context or in the URL
  const params = new URLSearchParams(location.search);
  const urlVehicleId = params.get('vehicleId');
  const isSelected = selectedVehicle?.id === vehicle.id || urlVehicleId === vehicle.id;
  
  // Use updated image URL if available, otherwise use the vehicle's image URL or placeholder
  const imageUrl = updatedImageUrl || vehicle.image_url || VEHICLE_PLACEHOLDER;
  
  const handleImageClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const handleSaveImage = useCallback(async (newImageUrl: string) => {
    try {
      console.log('Saving image URL:', newImageUrl);
      
      // Update local state immediately for instant feedback
      setUpdatedImageUrl(newImageUrl);
      
      // Update the database
      const updatedVehicle = await updateVehicleImage(vehicle.id, newImageUrl);
      
      if (updatedVehicle) {
        console.log('Vehicle updated successfully with new image URL:', newImageUrl);
        // Update the vehicle in the context
        setSelectedVehicle(updatedVehicle);
        // Refresh the vehicles list
        await refreshVehicles();
      } else {
        console.error('Failed to update vehicle in database, but keeping local state updated');
      }
    } catch (error) {
      console.error('Error saving vehicle image:', error);
      // Keep the updated URL in local state even if database update fails
      // This ensures the user sees the new image immediately
    } finally {
      setIsModalOpen(false);
    }
  }, [vehicle.id, setSelectedVehicle, refreshVehicles]);
  return (
    <div className={`block rounded-lg bg-white w-full min-w-[250px] transition-all duration-200 ${isSelected 
      ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-400' 
      : 'shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]'}`}>
      <div className="block w-full">
        <div 
          className="relative overflow-hidden bg-cover bg-no-repeat w-full"
        >
          {updatedImageUrl || vehicle.image_url ? (
            <VehicleImage 
              imageUrl={imageUrl}
              make={vehicle.make}
              model={vehicle.model}
              onImageClick={handleImageClick}
            />
          ) : (
            <button 
              onClick={handleImageClick}
              className="rounded-t-lg w-full h-48 flex flex-col items-center justify-center bg-gray-100 cursor-pointer hover:bg-gray-200 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-500 text-lg font-semibold select-none text-center">Add an image</span>
            </button>
          )}
          {/* Removed overlay effect that might interfere with button clicks */}
        </div>
      </div>
      <div className="p-4">
        <h5 className="mb-1 text-lg font-bold leading-tight text-neutral-800">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h5>
        <div className="mb-1 text-sm text-neutral-600">
          {vehicle.body_class || ''}
        </div>
        {vehicle.vin && (
          <div className="text-xs text-gray-400 mb-2 break-all">VIN: {vehicle.vin}</div>
        )}
        <div className="flex gap-2">
          <button 
            onClick={() => { setSelectedVehicle(vehicle); onDetails(vehicle); }}
            className="flex-1 mt-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Details
          </button>
          <button
            onClick={() => onOpenServiceRecordModal(vehicle.id)}
            className="flex-1 mt-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Service
          </button>
        </div>
      </div>
      {isModalOpen && (
        <ImageUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveImage}
          vehicleDetails={{
            id: vehicle.id,
            year: vehicle.year?.toString() || '',
            make: vehicle.make || '',
            model: vehicle.model || '',
            body_class: vehicle.body_class || undefined,
            color: vehicle.color || undefined
          }}
        />
      )}
    </div>
  );
}
