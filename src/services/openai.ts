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
Analyze this vehicle maintenance receipt image and extract all available information into a structured JSON format. Include the following categories and fields if present:

1. Customer Information:
   - Full name
   - Address/location
   - Phone number
   - Email address

2. Vehicle Details:
   - Make
   - Model
   - Year
   - VIN number
   - License plate
   - Odometer reading (specify miles or kilometers)
   - Engine type/size

3. Service Information:
   - Service date
   - Invoice/receipt number
   - Service provider name and location
   - Technician name (if available)

4. Services Performed (for each service item):
   - Category (e.g., Oil & Filters, Brakes, Transmission, etc.)
   - Description of service
   - Detailed specifications (e.g., oil type, filter numbers, part numbers)
   - Quantity and units (if applicable)
   - Individual price
   - Any notes or recommendations

5. Parts and Materials:
   - Part names
   - Part numbers
   - Quantities
   - Individual prices

6. Fluid Checks/Inspections Performed:
   - List all inspections mentioned (e.g., tire pressure, fluid levels)
   - Status or results of each inspection

7. Payment Information:
   - Subtotal
   - Taxes (separated by type if available)
   - Discounts or coupons applied
   - Total amount
   - Payment method

8. Additional Information:
   - Warranty information
   - Recommended next service date or mileage
   - Any special notes or comments

Format the response as a clean, well-structured JSON object with appropriate nesting. Convert all monetary values to numeric format without currency symbols. For dates, use ISO format (YYYY-MM-DD).
`;

/**
 * Analyzes an image using OpenAI's Vision API
 * @param imageBase64 - Base64 encoded image data
 * @returns Structured analysis of the vehicle document
 */
export const analyzeImage = async (imageBase64: string): Promise<any> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
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
      model: "gpt-4-turbo",
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

  // Return the formatted result
  return {
    vehicleInfo,
    maintenanceInfo,
    otherInfo: rawResult,
  };
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
