// Utility to decode VIN using the NHTSA Vehicle API
// https://vpic.nhtsa.dot.gov/api/

export interface DecodedVin {
  make: string;
  model: string;
  year: string;
  body_class?: string;

  [key: string]: any;
}

export async function decodeVin(vin: string): Promise<DecodedVin | null> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.Results) return null;
    const results = data.Results;
    const get = (label: string) => results.find((r: any) => r.Variable === label)?.Value || '';
    return {
      make: get('Make'),
      model: get('Model'),
      year: get('Model Year'),
      body_class: get('Body Class'),

    };
  } catch (e) {
    return null;
  }
}
