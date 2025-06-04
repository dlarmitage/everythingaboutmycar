import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// API endpoint for image generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log('Generating image with prompt:', prompt);
    
    try {
      // Try with DALL-E 3 model first
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data[0].url;
      return res.status(200).json({ imageUrl });
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

        const imageUrl = response.data[0].url;
        return res.status(200).json({ imageUrl });
      } catch (fallbackError) {
        console.error('Error with dall-e-2:', fallbackError);
        throw fallbackError;
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
