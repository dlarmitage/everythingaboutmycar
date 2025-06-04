import { supabase } from './supabase';
import type { Vehicle } from '../types';

/**
 * Update a vehicle's image URL in the database
 * @param vehicleId The ID of the vehicle to update
 * @param imageUrl The new image URL
 * @returns The updated vehicle or null if there was an error
 */
export const updateVehicleImage = async (vehicleId: string, imageUrl: string): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ image_url: imageUrl })
      .eq('id', vehicleId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating vehicle image:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception updating vehicle image:', error);
    return null;
  }
};
