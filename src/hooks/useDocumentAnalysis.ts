import { useState } from 'react';
import type { DocumentAnalysisResult } from '../types';
import openaiService from '../services/openai';
import supabase from '../services/supabase';
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
        targetFile = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob as Blob;
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
   * Extracts text from a PDF file
   * @param file - The PDF file
   * @returns Promise resolving to extracted text
   */
  const extractTextFromPdf = async (file: File): Promise<string> => {
    // In a real implementation, you would use a PDF parsing library
    // For this example, we'll just return a placeholder
    return `This is placeholder text that would be extracted from the PDF file: ${file.name}`;
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
      // Check if the documents bucket exists by listing buckets
      setProgress(5);
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking storage buckets:', bucketsError);
      }
      
      // Log available buckets to help with debugging
      console.log('Available storage buckets:', buckets);
      
      // Upload file to Supabase storage
      setProgress(10);
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicleId}/${Date.now()}.${fileExt}`;
      
      // Try to upload to the documents bucket
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      // If bucket not found, provide a helpful error message
      if (uploadError && uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage bucket "documents" not found. Please create this bucket in your Supabase project dashboard.');
      } else if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      setProgress(40);
      
      // Get public URL for the uploaded file
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
        // For PDFs, extract text and analyze
        const pdfText = await extractTextFromPdf(file);
        setProgress(60);
        analysisResult = await openaiService.analyzePdf(pdfText);
      } else {
        throw new Error('Unsupported file type. Please upload an image or PDF.');
      }
      
      setProgress(80);
      
      // Save document record in Supabase
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          vehicle_id: vehicleId,
          file_name: file.name,
          file_type: file.type,
          file_url: publicUrl,
          file_size: file.size,
          analyzed: true,
          analysis_result: analysisResult
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
