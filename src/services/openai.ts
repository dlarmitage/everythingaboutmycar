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
 * The comprehensive prompt for analyzing vehicle maintenance receipts
 */
const VEHICLE_DOCUMENT_ANALYSIS_PROMPT = `
Analyze this vehicle maintenance receipt image and extract all available information into the EXACT structured JSON format specified below. Follow this schema precisely:

{
  "customer": {
    "name": "string or null",
    "address": "string or null",
    "phone": "string or null",
    "email": "string or null"
  },
  "vehicle": {
    "make": "string or null",
    "model": "string or null",
    "year": "number or null",
    "vin": "string or null",
    "license_plate": "string or null",
    "odometer": "number or null",
    "odometer_unit": "miles or km or null",
    "engine": "string or null"
  },
  "service_information": {
    "service_date": "YYYY-MM-DD format or null",
    "invoice_number": "string or null",
    "service_provider": "string or null",
    "technician": "string or null",
    "location": "string or null"
  },
  "services": [
    {
      "category": "string (e.g., 'Oil Change', 'Brake Service', etc.)",
      "description": "string",
      "details": {
        // Any relevant specifications like oil_type, filter_type, etc.
      },
      "parts_replaced": ["string", "string"],
      "quantity": "number or null",
      "quantity_unit": "string or null",
      "price": "number or null"
    }
  ],
  "inspections": [
    {
      "type": "string",
      "result": "string",
      "notes": "string or null"
    }
  ],
  "payment": {
    "subtotal": "number or null",
    "tax": "number or null",
    "discount": "number or null",
    "total": "number or null",
    "method": "string or null"
  },
  "additional_information": {
    "warranty": "string or null",
    "recommended_next_service_date": "YYYY-MM-DD format or null",
    "recommended_next_service_mileage": "number or null",
    "notes": "string or null"
  }
}

Important rules:
1. Convert all monetary values to numeric format without currency symbols
2. Use ISO format dates (YYYY-MM-DD)
3. Use null for missing values, not empty strings
4. For odometer readings, extract just the numeric value and specify the unit separately
5. Include all service items with their details
6. Follow the exact field names shown above
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
          content: "You are an expert automotive technician and document analyst specializing in extracting detailed information from vehicle maintenance records, service invoices, and related documents."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: VEHICLE_DOCUMENT_ANALYSIS_PROMPT
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

    // Parse and transform the response into our application's format
    const rawResult = JSON.parse(response.choices[0]?.message?.content || '{}');
    return transformAnalysisResult(rawResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Analyzes a PDF document using OpenAI's API
 * @param pdfText - Extracted text from PDF
 * @returns Structured analysis of the vehicle document
 */
export const analyzePdf = async (pdfText: string): Promise<any> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive technician and document analyst specializing in extracting detailed information from vehicle maintenance records, service invoices, and related documents."
        },
        {
          role: "user",
          content: `${VEHICLE_DOCUMENT_ANALYSIS_PROMPT}\n\nDocument content:\n${pdfText}`,
        },
      ],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    // Parse and transform the response into our application's format
    const rawResult = JSON.parse(response.choices[0]?.message?.content || '{}');
    return transformAnalysisResult(rawResult);
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    throw error;
  }
};

/**
 * Transforms the raw OpenAI analysis result into our application's expected format
 * @param rawResult - The raw JSON result from OpenAI
 * @returns Formatted result matching our DocumentAnalysisResult type
 */
const transformAnalysisResult = (rawResult: any) => {
  console.log('Transforming raw OpenAI result:', rawResult);
  
  // Extract vehicle information
  const vehicleInfo = {
    make: rawResult.vehicle?.make,
    model: rawResult.vehicle?.model,
    year: rawResult.vehicle?.year,
    vin: rawResult.vehicle?.vin,
    licensePlate: rawResult.vehicle?.license_plate,
    color: rawResult.vehicle?.color,
    engine: rawResult.vehicle?.engine,
  };

  // Extract maintenance information
  const maintenanceInfo: any = {
    serviceDate: rawResult.service_date || rawResult.service_information?.service_date,
    serviceType: getMainServiceType(rawResult),
    description: getServiceDescription(rawResult),
    mileage: getMileage(rawResult),
    cost: getTotalCost(rawResult),
    serviceProvider: getServiceProvider(rawResult),
    partsReplaced: getPartsReplaced(rawResult),
    notes: rawResult.additional_information?.notes || '',
    isRecurring: false,
  };

  // Add next service information if available
  if (rawResult.additional_information?.recommended_next_service_date) {
    maintenanceInfo.nextServiceDate = rawResult.additional_information.recommended_next_service_date;
  }
  
  if (rawResult.additional_information?.recommended_next_service_mileage) {
    maintenanceInfo.nextServiceMileage = rawResult.additional_information.recommended_next_service_mileage;
  }

  // Return the formatted result with the complete raw data in otherInfo
  const result = {
    vehicleInfo,
    maintenanceInfo,
    otherInfo: rawResult,
  };
  
  console.log('Transformed result:', result);
  return result;
};

/**
 * Helper function to get the main service type from the raw result
 */
const getMainServiceType = (rawResult: any): string => {
  if (!rawResult.services || !Array.isArray(rawResult.services)) {
    return rawResult.service_information?.service_type || '';
  }
  
  // Try to determine the main service type from the services array
  const serviceTypes = rawResult.services.map((s: any) => s.category || s.description).filter(Boolean);
  if (serviceTypes.length === 0) return '';
  
  // If there's only one service or they're all the same type
  if (serviceTypes.length === 1 || new Set(serviceTypes).size === 1) {
    return serviceTypes[0];
  }
  
  // If there are multiple types, try to find the most significant one
  const priorityTypes = ['Oil Change', 'Maintenance', 'Repair', 'Inspection'];
  for (const type of priorityTypes) {
    const match = serviceTypes.find((s: string) => s.includes(type));
    if (match) return match;
  }
  
  // Default to a comma-separated list of service types
  return serviceTypes.join(', ');
};

/**
 * Helper function to get a comprehensive service description
 */
const getServiceDescription = (rawResult: any): string => {
  if (!rawResult.services || !Array.isArray(rawResult.services)) {
    return rawResult.service_information?.description || '';
  }
  
  return rawResult.services
    .map((s: any) => s.description || s.category)
    .filter(Boolean)
    .join('; ');
};

/**
 * Helper function to extract mileage information
 */
const getMileage = (rawResult: any): number | undefined => {
  if (rawResult.vehicle?.odometer_km) {
    return rawResult.vehicle.odometer_km;
  }
  
  if (rawResult.vehicle?.odometer_miles) {
    return rawResult.vehicle.odometer_miles;
  }
  
  if (rawResult.vehicle?.odometer) {
    return rawResult.vehicle.odometer;
  }
  
  return undefined;
};

/**
 * Helper function to calculate the total cost
 */
const getTotalCost = (rawResult: any): number | undefined => {
  if (rawResult.payment?.total) {
    return rawResult.payment.total;
  }
  
  // If there's no total but there are individual service costs
  if (rawResult.services && Array.isArray(rawResult.services)) {
    const sum = rawResult.services.reduce((total: number, service: any) => {
      return total + (service.price || 0);
    }, 0);
    return sum > 0 ? sum : undefined;
  }
  
  return undefined;
};

/**
 * Helper function to get the service provider information
 */
const getServiceProvider = (rawResult: any): string => {
  if (rawResult.service_information?.service_provider) {
    return rawResult.service_information.service_provider;
  }
  
  if (rawResult.service_provider) {
    return rawResult.service_provider;
  }
  
  if (rawResult.location) {
    return rawResult.location;
  }
  
  return '';
};

/**
 * Helper function to extract parts replaced
 */
const getPartsReplaced = (rawResult: any): string[] => {
  const parts: string[] = [];
  
  // Check if there's a dedicated parts section
  if (rawResult.parts && Array.isArray(rawResult.parts)) {
    parts.push(...rawResult.parts.map((p: any) => p.name || p.part_name || p.description));
  }
  
  // Check services for parts information
  if (rawResult.services && Array.isArray(rawResult.services)) {
    rawResult.services.forEach((service: any) => {
      if (service.parts_replaced) {
        if (Array.isArray(service.parts_replaced)) {
          parts.push(...service.parts_replaced);
        } else {
          parts.push(service.parts_replaced);
        }
      }
      
      // Check for filter replacements
      if (service.category?.toLowerCase().includes('filter') || 
          service.description?.toLowerCase().includes('filter')) {
        const filterInfo = service.filter_model || service.details?.filter || service.details?.oil_filter;
        if (filterInfo) parts.push(`Filter: ${filterInfo}`);
      }
      
      // Check for fluid replacements
      if (service.fluid) {
        parts.push(`${service.category || 'Fluid'}: ${service.fluid}`);
      }
    });
  }
  
  return parts.filter(Boolean);
};

export default {
  analyzeImage,
  analyzePdf,
};
