import { useState, useCallback } from 'react';
import ImageUploadModal from './ImageUploadModal';

const VEHICLE_PLACEHOLDER = 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/car.svg';

import type { Vehicle } from '../types';
import { useApp } from '../context/AppContext';
import { updateVehicleImage } from '../services/vehicleService';

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
  return (
    <div className="relative">
      <img
        className="rounded-t-lg w-full h-48 object-cover"
        src={imageUrl}
        alt={`${make} ${model}`}
      />
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

export default function VehicleCard({ vehicle, onDetails }: VehicleCardProps) {
  const { setSelectedVehicle, refreshVehicles } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedImageUrl, setUpdatedImageUrl] = useState<string | null>(null);
  
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
        // Update the vehicle in the context
        setSelectedVehicle(updatedVehicle);
        // Refresh the vehicles list
        await refreshVehicles();
      }
    } catch (error) {
      console.error('Error saving vehicle image:', error);
      // Revert to original image if there was an error
      setUpdatedImageUrl(null);
    } finally {
      setIsModalOpen(false);
    }
  }, [vehicle.id, setSelectedVehicle, refreshVehicles]);
  return (
    <div className="block rounded-lg bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] w-full min-w-[250px]">
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
            className="w-full mt-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Details
          </button>
        </div>
      </div>
      {isModalOpen && (
        <ImageUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveImage}
          vehicleDetails={{
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
