import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // Note: In production, API calls should be proxied through a backend
});

/**
 * Comprehensive prompt for extracting vehicle service data in our exact database format
 */
const SERVICE_EXTRACTION_PROMPT = `
You are an expert automotive service document analyzer. Extract ALL service information from this document and return it in the EXACT JSON format specified below.

CRITICAL REQUIREMENTS:
1. Return data that maps DIRECTLY to our database tables
2. Extract EVERY service item as a separate entry
3. Use consistent, standardized service types
4. Convert all dates to YYYY-MM-DD format
5. Convert all monetary values to numbers (no currency symbols)
6. Use null for missing values, never empty strings
7. Be very specific about service types and descriptions

REQUIRED JSON STRUCTURE:

{
  "service_record": {
    "service_date": "YYYY-MM-DD",
    "service_provider": "Exact business name from document",
    "mileage": number_or_null,
    "total_cost": number_or_null,
    "notes": "Any additional notes, warranty info, recommendations"
  },
  "service_items": [
    {
      "service_type": "STANDARDIZED_TYPE",
      "description": "Detailed description of what was done",
      "cost": number_or_null,
      "parts_replaced": ["part1", "part2"] or null,
      "quantity": number_or_null,
      "next_service_date": "YYYY-MM-DD" or null,
      "next_service_mileage": number_or_null
    }
  ],
  "vehicle_info": {
    "make": "string_or_null",
    "model": "string_or_null", 
    "year": number_or_null,
    "vin": "string_or_null",
    "license_plate": "string_or_null"
  }
}

STANDARDIZED SERVICE TYPES (use these exact values):
- "Oil Change"
- "Filter Replacement" 
- "Brake Service"
- "Tire Service"
- "Engine Service"
- "Transmission Service"
- "Cooling System"
- "Electrical System"
- "Suspension"
- "Exhaust System"
- "Fuel System"
- "Air Conditioning"
- "Battery Service"
- "Inspection"
- "Diagnostic"
- "Fluid Service"
- "Belt/Hose Service"
- "Tune-Up"
- "Emission Service"
- "Other Service"

EXTRACTION RULES:
1. Create separate service_items for each distinct service performed
2. If oil change includes filter, create TWO items: "Oil Change" and "Filter Replacement"
3. Group related parts in parts_replaced array
4. Extract specific part numbers, brands, specifications when available
5. Include labor and parts costs separately if itemized
6. Extract next service recommendations with specific dates/mileage
7. Be very detailed in descriptions - include oil type, filter type, part numbers, etc.

EXAMPLES:
- Oil change with filter → Two items: "Oil Change" (5W-30 Full Synthetic) + "Filter Replacement" (AC Delco PF123)
- Brake pad replacement → "Brake Service" with parts_replaced: ["Front brake pads", "Brake hardware kit"]
- Multi-point inspection → "Inspection" with detailed findings in description
- Tire rotation → "Tire Service" with description of rotation pattern

Extract EVERYTHING - don't miss any service items, parts, or recommendations!
`;

/**
 * Analyzes an image using OpenAI's Vision API
 * @param imageBase64 - Base64 encoded image data
 * @returns Structured analysis of the vehicle document
 */
export const analyzeImage = async (imageBase64: string): Promise<any> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive service document analyzer. Your job is to extract comprehensive service information and return it in a structured format that maps directly to a vehicle service database."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: SERVICE_EXTRACTION_PROMPT
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const rawResult = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log('Raw OpenAI extraction result:', rawResult);
    
    // Transform to our DocumentAnalysisResult format
    return transformToDocumentAnalysisResult(rawResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Analyzes a PDF document using OpenAI's API by converting to images first
 * @param file - The PDF file
 * @returns Structured analysis of the vehicle document
 */
export const analyzePdf = async (file: File): Promise<any> => {
  try {
    // Import PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up the worker - use a more reliable approach
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js';
    }
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF with better error handling
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      }).promise;
    } catch (pdfError) {
      console.error('PDF loading error:', pdfError);
      throw new Error(`Failed to load PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }
    
    const numPages = pdf.numPages;
    console.log(`PDF has ${numPages} pages`);
    
    // Convert each page to image
    const imagePromises = [];
    for (let pageNum = 1; pageNum <= Math.min(numPages, 5); pageNum++) { // Limit to first 5 pages
      imagePromises.push(convertPdfPageToImage(pdf, pageNum));
    }
    
    const images = await Promise.all(imagePromises);
    
    // Prepare content for OpenAI with all page images
    const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
      {
        type: "text" as const,
        text: `Please analyze this ${numPages}-page automotive service document and extract service information according to these requirements:\n\n${SERVICE_EXTRACTION_PROMPT}`
      }
    ];
    
    // Add each page image to the content
    images.forEach((imageDataUrl) => {
      content.push({
        type: "image_url" as const,
        image_url: {
          url: imageDataUrl,
        },
      });
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive service document analyzer. Your job is to extract comprehensive service information from PDF documents converted to images and return it in a structured format that maps directly to a vehicle service database."
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const rawResult = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log('Raw OpenAI PDF extraction result:', rawResult);
    
    // Transform to our DocumentAnalysisResult format
    return transformToDocumentAnalysisResult(rawResult);
  } catch (error: any) {
    console.error('Error analyzing PDF:', error);
    // If PDF processing fails, fall back to a simple approach
    throw new Error(`PDF analysis failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Converts a single PDF page to a base64 image data URL
 */
const convertPdfPageToImage = async (pdf: any, pageNum: number): Promise<string> => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  
  await page.render(renderContext).promise;
  
  // Convert canvas to base64 data URL
  return canvas.toDataURL('image/png');
};

/**
 * Transforms the structured OpenAI result into our DocumentAnalysisResult format
 */
const transformToDocumentAnalysisResult = (rawResult: any) => {
  const serviceRecord = rawResult.service_record || {};
  const serviceItems = rawResult.service_items || [];
  const vehicleInfo = rawResult.vehicle_info || {};

  // Create the main service info from the service record
  const serviceInfo = {
    serviceDate: serviceRecord.service_date,
    mileage: serviceRecord.mileage,
    serviceProvider: serviceRecord.service_provider,
    totalCost: serviceRecord.total_cost,
    notes: serviceRecord.notes,
    items: serviceItems.map((item: any) => ({
      serviceType: item.service_type,
      description: item.description,
      cost: item.cost,
      partsReplaced: item.parts_replaced,
      quantity: item.quantity,
      nextServiceDate: item.next_service_date,
      nextServiceMileage: item.next_service_mileage,
    }))
  };

  const result = {
    vehicleInfo: {
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      year: vehicleInfo.year,
      vin: vehicleInfo.vin,
      licensePlate: vehicleInfo.license_plate,
    },
    serviceInfo,
    // Store the raw structured result for easy database insertion
    rawStructuredData: rawResult,
  };

  console.log('Transformed DocumentAnalysisResult:', result);
  return result;
};

export default {
  analyzeImage,
  analyzePdf,
};
