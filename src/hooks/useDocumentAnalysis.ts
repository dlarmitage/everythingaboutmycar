import { useState } from 'react';
import type { DocumentAnalysisResult } from '../types';
import openaiService from '../services/openai';
import supabase, { supabaseServiceRole } from '../services/supabase';
// @ts-ignore
import heic2any from 'heic2any';

/**
 * Custom hook for analyzing vehicle documents using OpenAI
 * @returns Object containing analysis functions and state
 */
export const useDocumentAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);

  /**
   * Converts a file to base64 encoding
   * @param file - The file to convert
   * @returns Promise resolving to base64 string
   */
  const fileToBase64 = async (file: File): Promise<string> => {
    let targetFile = file;
    // Convert HEIC to JPEG if needed
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const jpegBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.95,
        });
        // heic2any returns a Blob or an array of Blobs
        const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
        // Convert Blob to File to maintain compatibility
        targetFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
      } catch (err) {
        throw new Error('Failed to convert HEIC to JPEG: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(targetFile);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };


  /**
   * Analyzes a document file (image or PDF)
   * @param file - The document file to analyze
   * @param vehicleId - ID of the vehicle associated with the document
   * @returns Promise resolving to object containing analysis result and document ID
   */
  const analyzeDocument = async (
    file: File,
    vehicleId: string
  ): Promise<{ result: DocumentAnalysisResult; documentId: string }> => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Upload file to Supabase storage
      setProgress(10);
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicleId}/${Date.now()}.${fileExt}`;
      
      console.log(`Attempting to upload file: ${fileName} to documents bucket`);
      
      // Use service role client for storage upload to bypass RLS
      const storageClient = supabaseServiceRole || supabase;
      console.log('Using service role client:', !!supabaseServiceRole);
      
      // Try to upload to the documents bucket
      const { error: uploadError } = await storageClient.storage
        .from('documents')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage bucket "documents" not found. Please create this bucket in your Supabase project dashboard.');
        } else if (uploadError.message.includes('row-level security policy')) {
          throw new Error('Permission denied: Please ensure the documents storage bucket has the correct RLS policies configured.');
        } else {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }
      }
      
      console.log(`File uploaded successfully: ${fileName}`);
      setProgress(40);
      
      // Get public URL for the uploaded file (can use regular client for this)
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      // Analyze the document based on file type
      let analysisResult: any;
      
      if (file.type.startsWith('image/')) {
        // For images, convert to base64 and use Vision API
        const base64 = await fileToBase64(file);
        setProgress(60);
        analysisResult = await openaiService.analyzeImage(base64);
      } else if (file.type === 'application/pdf') {
        // For PDFs, pass the file directly to GPT-4o (it can read PDFs natively)
        setProgress(60);
        analysisResult = await openaiService.analyzePdf(file);
      } else {
        throw new Error('Unsupported file type. Please upload an image or PDF.');
      }
      
      setProgress(80);
      
      // Log the analysis result for debugging
      console.log('Raw analysis result from OpenAI:', JSON.stringify(analysisResult));
      
      // Save document record in Supabase
      // Note: service_record_id will be updated later when the service record is saved
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          vehicle_id: vehicleId,
          file_name: file.name,
          file_type: file.type,
          file_url: publicUrl,
          file_size: file.size,
          analyzed: true,
          analysis_result: analysisResult,
          service_record_id: null // Will be updated after service record is created
        })
        .select('id')
        .single();
      
      if (dbError) throw new Error(`Error saving document: ${dbError.message}`);
      if (!documentData) throw new Error('Failed to retrieve document ID after insert');
      
      setProgress(100);
      setResult(analysisResult);
      return {
        result: analysisResult,
        documentId: documentData.id
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeDocument,
    isAnalyzing,
    progress,
    error,
    result,
  };
};
