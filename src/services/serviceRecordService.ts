import { supabase } from './supabase';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, ServiceItem } from '../types';

/**
 * Create a new service record and its associated service items
 * @param serviceRecord The service record to create
 * @param serviceItems The service items associated with the service record
 * @returns The created service record and service items, or null if there was an error
 */
export const createServiceRecord = async (
  serviceRecord: ServiceRecordInsert,
  serviceItems: Omit<ServiceItemInsert, 'service_record_id'>[]
): Promise<{ record: ServiceRecord; items: ServiceItem[] } | null> => {
  try {
    // Validate inputs
    if (!serviceRecord.vehicle_id) {
      console.error('Vehicle ID is required');
      return null;
    }

    if (!serviceRecord.service_date) {
      console.error('Service date is required');
      return null;
    }

    if (!serviceItems || serviceItems.length === 0) {
      console.error('At least one service item is required');
      return null;
    }

    // Start a transaction
    const { data: record, error: recordError } = await supabase
      .from('service_records')
      .insert(serviceRecord)
      .select()
      .single();

    if (recordError) {
      console.error('Error creating service record:', recordError);
      return null;
    }

    // Add the service_record_id to each service item
    const itemsWithRecordId = serviceItems.map(item => ({
      ...item,
      service_record_id: record.id
    }));

    // Insert all service items
    const { data: items, error: itemsError } = await supabase
      .from('service_items')
      .insert(itemsWithRecordId)
      .select();

    if (itemsError) {
      console.error('Error creating service items:', itemsError);
      // Delete the created service record if items fail to maintain data integrity
      const { error: deleteError } = await supabase
        .from('service_records')
        .delete()
        .eq('id', record.id);
      
      if (deleteError) {
        console.error('Error cleaning up service record after item insertion failure:', deleteError);
      }
      return null;
    }

    return { record, items };
  } catch (error) {
    console.error('Exception creating service record:', error);
    return null;
  }
};

/**
 * Get all service records for a vehicle
 * @param vehicleId The ID of the vehicle
 * @returns An array of service records
 */
export const getServiceRecords = async (vehicleId: string): Promise<ServiceRecord[]> => {
  try {
    console.log(`getServiceRecords: Fetching records for vehicle ID: ${vehicleId}`);
    
    // First, let's check if the record exists at all, regardless of vehicle ID
    const { data: allRecords, error: allError } = await supabase
      .from('service_records')
      .select();
      
    if (allError) {
      console.error('Error fetching all service records:', allError);
    } else {
      console.log(`Total service records in database: ${allRecords.length}`);
      // Log all records to see their vehicle_id values
      allRecords.forEach(record => {
        console.log(`Record ID: ${record.id}, Vehicle ID: ${record.vehicle_id}, Date: ${record.service_date}`);
      });
    }
    
    // Now do the actual filtered query
    const { data, error } = await supabase
      .from('service_records')
      .select()
      .eq('vehicle_id', vehicleId)
      .order('service_date', { ascending: false });

    if (error) {
      console.error('Error fetching service records:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} records for vehicle ID ${vehicleId}:`, data);
    return data || [];
  } catch (error) {
    console.error('Exception fetching service records:', error);
    return [];
  }
};

/**
 * Get all service items for a service record
 * @param serviceRecordId The ID of the service record
 * @returns An array of service items
 */
export const getServiceItems = async (serviceRecordId: string): Promise<ServiceItem[]> => {
  try {
    const { data, error } = await supabase
      .from('service_items')
      .select()
      .eq('service_record_id', serviceRecordId);

    if (error) {
      console.error('Error fetching service items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching service items:', error);
    return [];
  }
};

/**
 * Delete a service record and its associated service items
 * @param serviceRecordId The ID of the service record to delete
 * @returns true if successful, false otherwise
 */
export const deleteServiceRecord = async (serviceRecordId: string): Promise<boolean> => {
  try {
    // Service items will be deleted automatically due to the ON DELETE CASCADE constraint
    const { error } = await supabase
      .from('service_records')
      .delete()
      .eq('id', serviceRecordId);

    if (error) {
      console.error('Error deleting service record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting service record:', error);
    return false;
  }
};

/**
 * Get a single service record by ID
 * @param serviceRecordId The ID of the service record
 * @returns The service record or null if not found
 */
export const getServiceRecordById = async (serviceRecordId: string): Promise<ServiceRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('service_records')
      .select()
      .eq('id', serviceRecordId)
      .single();

    if (error) {
      console.error('Error fetching service record:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching service record:', error);
    return null;
  }
};

/**
 * Get all service items for a service record
 * @param serviceRecordId The ID of the service record
 * @returns An array of service items
 */
export const getServiceItemsByRecordId = async (serviceRecordId: string): Promise<ServiceItem[]> => {
  return getServiceItems(serviceRecordId);
};

/**
 * Update an existing service record and its associated service items
 * @param serviceRecordId The ID of the service record to update
 * @param serviceRecord The updated service record data
 * @param serviceItems The updated service items
 * @returns The updated service record and items, or null if there was an error
 */
export const updateServiceRecord = async (
  serviceRecordId: string,
  serviceRecord: Omit<ServiceRecordInsert, 'id'>,
  serviceItems: Omit<ServiceItemInsert, 'service_record_id'>[]
): Promise<{ record: ServiceRecord; items: ServiceItem[] } | null> => {
  try {
    // Validate inputs
    if (!serviceRecordId) {
      console.error('Service record ID is required');
      return null;
    }

    if (!serviceRecord.vehicle_id) {
      console.error('Vehicle ID is required');
      return null;
    }

    if (!serviceRecord.service_date) {
      console.error('Service date is required');
      return null;
    }

    if (!serviceItems || serviceItems.length === 0) {
      console.error('At least one service item is required');
      return null;
    }

    // Update the service record
    const { data: record, error: recordError } = await supabase
      .from('service_records')
      .update(serviceRecord)
      .eq('id', serviceRecordId)
      .select()
      .single();

    if (recordError) {
      console.error('Error updating service record:', recordError);
      return null;
    }

    // Delete existing service items
    const { error: deleteError } = await supabase
      .from('service_items')
      .delete()
      .eq('service_record_id', serviceRecordId);

    if (deleteError) {
      console.error('Error deleting existing service items:', deleteError);
      return null;
    }

    // Add the service_record_id to each service item
    const itemsWithRecordId = serviceItems.map(item => ({
      ...item,
      service_record_id: serviceRecordId
    }));

    // Insert all service items
    const { data: items, error: itemsError } = await supabase
      .from('service_items')
      .insert(itemsWithRecordId)
      .select();

    if (itemsError) {
      console.error('Error creating service items:', itemsError);
      return null;
    }

    return { record, items };
  } catch (error) {
    console.error('Exception updating service record:', error);
    return null;
  }
};
