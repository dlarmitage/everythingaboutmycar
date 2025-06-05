import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the .env file directly to access VITE_ prefixed variables
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const match = line.match(/^VITE_OPENAI_API_KEY=(.*)$/);
  if (match) {
    acc.OPENAI_API_KEY = match[1];
  }
  return acc;
}, {});

const app = express();
const PORT = process.env.API_PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({
  apiKey: envVars.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

// Log API key status (not the actual key)
console.log(`OpenAI API key ${envVars.OPENAI_API_KEY ? 'found' : 'not found'} in .env file`);

// Add required modules for downloading images and working with files
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Log Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client with options matching frontend
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

// Helper function to download image and upload to Supabase
async function downloadAndStoreImage(url, vehicleId) {
  try {
    console.log('Downloading image from:', url);
    console.log('Using vehicle ID:', vehicleId);
    
    if (!vehicleId) {
      throw new Error('Vehicle ID is required for image storage');
    }
    
    // Download the image using fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a unique filename using the same pattern as service records
    const timestamp = Date.now();
    const filename = `${vehicleId}/${timestamp}.png`;
    
    console.log('Uploading to path:', filename);
    
    // Check available buckets for debugging
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      throw bucketsError;
    }
    console.log('Available storage buckets:', buckets);
    
    // Upload directly using buffer instead of File object
    // This matches how Node.js typically handles binary data
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw error;
    }
    
    // Get public URL for the uploaded file from the documents bucket
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filename);
    
    console.log('Image uploaded to Supabase documents bucket, public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in downloadAndStoreImage:', error);
    throw error;
  }
}

// API endpoint for image generation
// Add a proxy endpoint to fetch images from Supabase storage or external URLs
app.get('/api/proxy-image', async (req, res) => {
  try {
    let imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    console.log('Processing image URL:', imageUrl);
    // First, try to fetch the image directly from the URL
    try {
      const response = await fetch(imageUrl, { headers: { 'Accept': 'image/*' } });
      if (!response.ok) {
        throw new Error(`Failed to fetch image directly: ${response.status}`);
      }
      const buffer = await response.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));
      const contentType = response.headers.get('content-type') || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch (directFetchError) {
      console.log('Direct fetch failed, trying Supabase storage:', directFetchError.message);
      // Only attempt Supabase fallback for Supabase storage URLs
      if (imageUrl.includes('supabase.co') && imageUrl.includes('documents')) {
        try {
          // Parse the URL and extract the path after '/documents/'
          const urlObj = new URL(imageUrl);
          const match = urlObj.pathname.match(/\/documents\/(.+)$/);
          if (match && match[1]) {
            const storagePath = match[1];
            console.log('Trying Supabase storage with path:', storagePath);
            const { data, error } = await supabase.storage.from('documents').download(storagePath);
            if (error) {
              console.error('Error downloading from Supabase storage:', error);
              return res.status(404).json({ error: 'Image not found in storage' });
            }
            const buffer = await data.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));
            const ext = storagePath.split('.').pop().toLowerCase();
            const contentType = ext === 'png' ? 'image/png' :
              ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(buffer);
          } else {
            console.error('Could not extract storage path from Supabase URL:', imageUrl);
          }
        } catch (parseError) {
          console.error('Error parsing Supabase URL:', parseError);
        }
      }
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error in proxy-image endpoint:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, vehicleId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!vehicleId) {
      return res.status(400).json({ error: 'Vehicle ID is required' });
    }
    
    console.log('Generating image with prompt:', prompt);
    console.log('For vehicle ID:', vehicleId);
    
    try {
      // Generate image with DALL-E 3
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      });

      const tempImageUrl = response.data[0].url;
      console.log('Image generated successfully with DALL-E 3');
      
      // Download the image and store it directly in Supabase
      try {
        // Use our helper function to download and store the image
        const storedImageUrl = await downloadAndStoreImage(tempImageUrl, vehicleId);
        
        return res.status(200).json({ 
          imageUrl: storedImageUrl,
          vehicleId
        });
      } catch (storageError) {
        console.error('Error storing image in Supabase:', storageError);
        return res.status(500).json({ error: 'Failed to store generated image' });
      }
    } catch (modelError) {
      console.error('Error with dall-e-3, trying dall-e-2:', modelError);
      
      try {
        // Fall back to DALL-E 2 if DALL-E 3 fails
        const response = await openai.images.generate({
          model: "dall-e-2",
          prompt,
          n: 1,
          size: "1024x1024",
        });

        const tempImageUrl = response.data[0].url;
        console.log('Image generated successfully with DALL-E 2');
        
        // Download the image and store it directly in Supabase
        try {
          // Use our helper function to download and store the image
          const storedImageUrl = await downloadAndStoreImage(tempImageUrl, vehicleId);
          
          return res.status(200).json({ 
            imageUrl: storedImageUrl,
            vehicleId
          });
        } catch (storageError) {
          console.error('Error storing image in Supabase:', storageError);
          return res.status(500).json({ error: 'Failed to store generated image' });
        }
      } catch (fallbackError) {
        console.error('Error with dall-e-2:', fallbackError);
        return res.status(500).json({ error: 'Failed to generate image' });
      }
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Proxy all other requests to Vite dev server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
}));

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
