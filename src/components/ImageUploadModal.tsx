import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  vehicleDetails: {
    year: string;
    make: string;
    model: string;
    body_class?: string;
    color?: string;
  };
}

export default function ImageUploadModal({ isOpen, onClose, onSave, vehicleDetails }: ImageUploadModalProps) {
  const [selectedTab, setSelectedTab] = useState<'upload' | 'generate'>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Create a detailed prompt based on vehicle details
      const { year, make, model, body_class, color } = vehicleDetails;
      let prompt = `A professional, high-quality photograph of a ${year} ${make} ${model}`;
      
      if (body_class) {
        prompt += ` ${body_class}`;
      }
      
      if (color) {
        prompt += ` in ${color} color`;
      }
      
      prompt += `. The vehicle should be shown from a 3/4 front angle in a well-lit outdoor setting with a clean background.`;
      
      // Call our API endpoint to generate image
      const response = await fetch('http://localhost:3005/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      setUploadedImage(null);
    } catch (error) {
      console.error('Error generating image:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setGenerationError('API server is not running. Please start the API server with "npm run api"');
      } else {
        setGenerationError((error instanceof Error ? error.message : 'Failed to generate image. Please try again.'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const imageUrl = selectedTab === 'upload' ? uploadedImage : generatedImage;
    if (imageUrl) {
      // Ensure we're passing the actual image URL, not a placeholder
      console.log('Saving image URL:', imageUrl);
      
      // Call the parent's onSave function
      onSave(imageUrl);
      
      // Force a window reload after a short delay to ensure the image updates
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const currentImage = selectedTab === 'upload' ? uploadedImage : generatedImage;
  const canSave = !!currentImage;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add Vehicle Image
                    </Dialog.Title>
                    
                    {/* Tab Selection */}
                    <div className="mt-4 border-b border-gray-200">
                      <div className="flex -mb-px">
                        <button
                          onClick={() => setSelectedTab('upload')}
                          className={`mr-8 py-4 text-sm font-medium ${
                            selectedTab === 'upload'
                              ? 'border-b-2 border-blue-500 text-blue-600'
                              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <PhotoIcon className="h-5 w-5 mr-2" />
                            Upload Image
                          </div>
                        </button>
                        <button
                          onClick={() => setSelectedTab('generate')}
                          className={`py-4 text-sm font-medium ${
                            selectedTab === 'generate'
                              ? 'border-b-2 border-blue-500 text-blue-600'
                              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            Generate with AI
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="mt-4">
                      {selectedTab === 'upload' ? (
                        <div>
                          {!uploadedImage ? (
                            <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                              <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                                  >
                                    <span>Upload a file</span>
                                    <input 
                                      id="file-upload" 
                                      name="file-upload" 
                                      type="file" 
                                      className="sr-only" 
                                      accept="image/*"
                                      onChange={handleFileChange}
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <img 
                                src={uploadedImage} 
                                alt="Uploaded vehicle" 
                                className="w-full h-64 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setUploadedImage(null)}
                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                              >
                                <XMarkIcon className="h-5 w-5 text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {!generatedImage ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                              <SparklesIcon className="h-12 w-12 text-gray-300 mb-4" aria-hidden="true" />
                              <p className="text-sm text-gray-600 mb-6">
                                Generate an AI image of your {vehicleDetails.year} {vehicleDetails.make} {vehicleDetails.model}
                              </p>
                              <button
                                type="button"
                                onClick={handleGenerateImage}
                                disabled={isGenerating}
                                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
                              >
                                {isGenerating ? 'Generating...' : 'Generate Image'}
                              </button>
                              {generationError && (
                                <p className="mt-2 text-sm text-red-600">{generationError}</p>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <img 
                                src={generatedImage} 
                                alt="AI generated vehicle" 
                                className="w-full h-64 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setGeneratedImage(null)}
                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                              >
                                <XMarkIcon className="h-5 w-5 text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300 sm:col-start-2"
                    onClick={handleSave}
                    disabled={!canSave}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
