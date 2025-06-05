import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useApp } from '../context/AppContext';
import type { DocumentAnalysisResult } from '../types';

type DocumentUploaderProps = {
  onAnalysisComplete?: (result: DocumentAnalysisResult, documentId: string) => Promise<void>;
  disabled?: boolean;
};

const DocumentUploader = ({ onAnalysisComplete, disabled = false }: DocumentUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const { analyzeDocument, isAnalyzing, progress, error } = useDocumentAnalysis();
  const { selectedVehicle, refreshDocuments } = useApp();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedVehicle) return;
    
    try {
      const { result, documentId } = await analyzeDocument(selectedFile, selectedVehicle.id);
      setSelectedFile(null);
      await refreshDocuments();
      
      if (onAnalysisComplete && documentId) {
        await onAnalysisComplete(result, documentId);
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
      
      // Check if the error is related to the missing storage bucket
      if (err instanceof Error && err.message.includes('Bucket not found')) {
        // The error is already handled by the useDocumentAnalysis hook
        // which sets the error state that will be displayed to the user
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*, application/pdf"
          className="hidden"
        />
        
        {!selectedFile ? (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop a file here, or{' '}
              <button
                type="button"
                className="text-primary-600 hover:text-primary-500 focus:outline-none"
                onClick={handleUploadClick}
                disabled={disabled}
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: PNG, JPG, PDF (max 10MB)
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <button
                type="button"
                className="btn-secondary text-sm py-1 px-3"
                onClick={() => setSelectedFile(null)}
                disabled={disabled}
              >
                Remove
              </button>
              <button
                type="button"
                className="btn-primary text-sm py-1 px-3"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedVehicle || disabled}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
              </button>
            </div>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-center mt-1 text-gray-500">
            Analyzing document... {progress}%
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
