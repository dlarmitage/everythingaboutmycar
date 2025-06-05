import { useState } from 'react';
import type { ServiceRecordInsert, ServiceItemInsert, ServiceRecord, DocumentAnalysisResult } from '../types';
import supabase from '../services/supabase';

// Define interfaces for the AI analysis result structure
interface ServiceItem {
  category?: string;
  description?: string;
  price?: number;
  parts_replaced?: string[];
  serviceType?: string;
  cost?: number;
  partsReplaced?: string[];
}

interface MaintenanceInfo {
  serviceDate?: string;
  serviceType?: string;
  description?: string;
  mileage?: number;
  cost?: number;
  serviceProvider?: string;
  partsReplaced?: string[];
  notes?: string;
}

interface ServiceInfo {
  serviceDate?: string;
  serviceType?: string;
  description?: string;
  mileage?: number;
  totalCost?: number;
  serviceProvider?: string;
  notes?: string;
  items?: Array<{
    serviceType?: string;
    description?: string;
    cost?: number;
    partsReplaced?: string[];
  }>;
}

interface OtherInfo {
  service_information?: {
    service_date?: string;
    service_provider?: string;
  };
  vehicle?: {
    odometer?: number;
  };
  payment?: {
    total?: number;
  };
  additional_information?: {
    notes?: string;
  };
  services?: ServiceItem[];
}

interface UseAIExtractionProps {
  onSaveServiceRecord: (serviceRecord: ServiceRecordInsert, serviceItems: ServiceItemInsert[]) => Promise<ServiceRecord | null>;
}

export default function useAIExtraction({ onSaveServiceRecord }: UseAIExtractionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedRecord, setExtractedRecord] = useState<ServiceRecordInsert | null>(null);
  const [extractedItems, setExtractedItems] = useState<ServiceItemInsert[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle document analysis completion
  const handleAnalysisComplete = (analysisResult: DocumentAnalysisResult, documentId: string) => {
    setIsProcessing(false);
    
    if (!analysisResult) {
      setError('Failed to extract data from document');
      return;
    }
    
    try {
      // Store the document ID for linking later
      setDocumentId(documentId);
      
      // Log the analysis result for debugging
      console.log('Processing AI analysis result:', analysisResult);
      
      // Check if we have the new structured format with rawStructuredData
      const rawData = (analysisResult as any).rawStructuredData;
      
      if (rawData && rawData.service_record && rawData.service_items) {
        // Use the new structured format
        console.log('Using new structured data format');
        
        const serviceRecord: ServiceRecordInsert = {
          vehicle_id: '', // This will be set by the parent component when saving
          service_date: rawData.service_record.service_date || new Date().toISOString().split('T')[0],
          mileage: rawData.service_record.mileage || null,
          service_provider: rawData.service_record.service_provider || '',
          total_cost: rawData.service_record.total_cost || null,
          notes: rawData.service_record.notes || '',
        };
        
        // Create service items from the structured data
        const serviceItems: ServiceItemInsert[] = rawData.service_items.map((item: any) => ({
          service_record_id: '', // Will be filled in after service record is created
          service_type: item.service_type || 'Other Service',
          description: item.description || '',
          cost: item.cost || null,
          parts_replaced: item.parts_replaced || null,
          quantity: item.quantity || null,
          next_service_date: item.next_service_date || null,
          next_service_mileage: item.next_service_mileage || null,
        }));
        
        console.log('Extracted service record:', serviceRecord);
        console.log('Extracted service items:', serviceItems);
        
        setExtractedRecord(serviceRecord);
        setExtractedItems(serviceItems);
        setError(null);
        return;
      }
      
      // Fallback to legacy format processing
      console.log('Using legacy data format');
      
      // Extract data from the appropriate structure
      // The API might return data in different formats, so we need to handle both
      const maintenanceInfo = (analysisResult.maintenanceInfo || {}) as MaintenanceInfo;
      const serviceInfo = (analysisResult.serviceInfo || {}) as ServiceInfo;
      const otherInfo = (analysisResult.otherInfo || {}) as OtherInfo;
      
      // Get service date
      const serviceDate = 
        maintenanceInfo.serviceDate || 
        serviceInfo.serviceDate || 
        (otherInfo.service_information?.service_date) || 
        new Date().toISOString().split('T')[0];
      
      // Get mileage
      const mileage = 
        maintenanceInfo.mileage || 
        serviceInfo.mileage || 
        otherInfo.vehicle?.odometer || 
        null;
      
      // Get service provider
      const serviceProvider = 
        maintenanceInfo.serviceProvider || 
        serviceInfo.serviceProvider || 
        otherInfo.service_information?.service_provider || 
        '';
      
      // Get total cost
      const totalCost = 
        maintenanceInfo.cost || 
        serviceInfo.totalCost || 
        otherInfo.payment?.total || 
        null;
      
      // Get notes
      const notes = 
        maintenanceInfo.notes || 
        serviceInfo.notes || 
        otherInfo.additional_information?.notes || 
        '';
      
      // Create service record from AI data
      const serviceRecord: ServiceRecordInsert = {
        vehicle_id: '', // This will be set by the parent component when saving
        service_date: serviceDate,
        mileage: mileage,
        service_provider: serviceProvider,
        total_cost: totalCost,
        notes: notes,
      };
      
      // Create service items from AI data
      const serviceItems: ServiceItemInsert[] = [];
      
      // Try to extract service items from different possible structures
      const services = otherInfo.services || [];
      
      if (services.length > 0) {
        // If we have services in otherInfo, use those
        services.forEach((service: ServiceItem) => {
          serviceItems.push({
            service_record_id: '', // Will be filled in after service record is created
            service_type: service.category || 'Maintenance',
            description: service.description || '',
            cost: service.price || null,
            parts_replaced: service.parts_replaced || [],
          });
        });
      } else if (maintenanceInfo.partsReplaced && maintenanceInfo.partsReplaced.length > 0) {
        // If we have parts replaced in maintenanceInfo, create a service item for each
        serviceItems.push({
          service_record_id: '',
          service_type: maintenanceInfo.serviceType || 'Maintenance',
          description: maintenanceInfo.description || '',
          cost: maintenanceInfo.cost || null,
          parts_replaced: maintenanceInfo.partsReplaced || [],
        });
      } else if (analysisResult.serviceInfo?.items && Array.isArray(analysisResult.serviceInfo.items)) {
        // Fall back to the original structure if available
        analysisResult.serviceInfo.items.forEach((service) => {
          serviceItems.push({
            service_record_id: '',
            service_type: service.serviceType || 'Maintenance',
            description: service.description || '',
            cost: service.cost || null,
            parts_replaced: service.partsReplaced || [],
          });
        });
      }
      
      // If we still have no service items but have a description, create a generic one
      if (serviceItems.length === 0 && (maintenanceInfo.description || serviceInfo.description)) {
        serviceItems.push({
          service_record_id: '',
          service_type: maintenanceInfo.serviceType || serviceInfo.serviceType || 'Maintenance',
          description: maintenanceInfo.description || serviceInfo.description || '',
          cost: totalCost, // Use the total cost for the single item
          parts_replaced: maintenanceInfo.partsReplaced || [],
        });
      }
      
      console.log('Extracted service record:', serviceRecord);
      console.log('Extracted service items:', serviceItems);
      
      setExtractedRecord(serviceRecord);
      setExtractedItems(serviceItems);
      setError(null);
    } catch (error) {
      console.error('Error processing AI analysis result:', error);
      setError('Failed to process the document. Please try again or enter details manually.');
      setExtractedRecord(null);
      setExtractedItems([]);
    }
  };
  
  // Save the AI-extracted service record and link to document
  const saveExtractedRecord = async (vehicleId: string) => {
    if (!extractedRecord) return null;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Set the vehicle ID before saving
      const recordToSave = {
        ...extractedRecord,
        vehicle_id: vehicleId
      };
      
      // Save the service record first
      const savedServiceRecord = await onSaveServiceRecord(recordToSave, extractedItems);
      
      // If we have a document ID and the service record was saved successfully, update the document record
      if (documentId && savedServiceRecord) {
        try {
          const { error } = await supabase
            .from('documents')
            .update({ service_record_id: savedServiceRecord.id })
            .eq('id', documentId);
            
          if (error) {
            console.error('Error linking document to service record:', error);
          } else {
            console.log(`Successfully linked document ${documentId} to service record ${savedServiceRecord.id}`);
          }
        } catch (linkError) {
          console.error('Error updating document with service record ID:', linkError);
        }
      }
      
      // Reset AI data after successful save
      resetExtractedData();
      return savedServiceRecord;
    } catch (error) {
      console.error('Error saving AI-extracted service record:', error);
      setError('Failed to save service record');
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset all extracted data
  const resetExtractedData = () => {
    setExtractedRecord(null);
    setExtractedItems([]);
    setDocumentId(null);
    setError(null);
  };
  
  return {
    isProcessing,
    setIsProcessing,
    isSaving,
    error,
    setError,
    extractedRecord,
    extractedItems,
    documentId,
    handleAnalysisComplete,
    saveExtractedRecord,
    resetExtractedData
  };
}
