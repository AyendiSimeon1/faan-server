import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import AppError from '../utils/AppError';

// Utility to map AI-detected vehicle types to internal types
export function mapAIVehicleTypeToInternal(type?: string): 'suv' | 'bus' | 'large_bus' | 'regular' {
  if (!type) return 'regular';
  const t = type.toLowerCase();
  if (t.includes('suv')) return 'suv';
  if (t.includes('large') && t.includes('bus')) return 'large_bus';
  if (t.includes('bus')) return 'bus';
  if (t.includes('sedan') || t.includes('hatchback') || t.includes('coupe') || t.includes('wagon') || t.includes('convertible')) return 'regular';
  return 'regular'; // fallback
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyDzVrsvTRLdsVEpDUQwAeKnxSe92POysKo');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export class ImageProcessingService {
  static async processCarImage(imageBuffer: Buffer): Promise<{ 
    plateNumber?: string;
    carDetails?: {
      make?: string;
      model?: string;
      color?: string;
      type?: string;
      internalType?: 'suv' | 'bus' | 'large_bus' | 'regular';
    };
    confidence: number;
  }> {
    try {
      console.log('Starting image processing...');
      
      // Resize and optimize image if needed
      const processedImage = await sharp(imageBuffer)
        .resize(800, 600, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      console.log('Image processed successfully');

      // Convert the image to base64 for Gemini
      const base64Image = processedImage.toString('base64');
      
      // Prepare the image part for Gemini
      const imageParts = [{
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }];

      // Generate content with Gemini
      const prompt = `Analyze this car image and extract the following details:
- License plate number
- Car manufacturer (make)
- Car model
- Car color
- Vehicle type (e.g., SUV, sedan, hatchback, coupe, bus, large bus, convertible, wagon, etc.)

Respond ONLY with a JSON object in this exact format, nothing else:
{
  "plateNumber": "extracted plate number",
  "make": "car manufacturer",
  "model": "car model",
  "color": "car color",
  "type": "vehicle type (e.g., sedan, suv, bus, large bus, hatchback, coupe, convertible, wagon, etc.)",
  "confidence": 0.95
}`;

      const result = await model.generateContent([
        prompt,
        ...imageParts
      ]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw Gemini response:', text);

      // Parse the JSON response
      try {
        // Clean up the response text by removing markdown code blocks
        const cleanText = text.replace(/```json\n|```\n|```/g, '').trim();
        console.log('Cleaned text:', cleanText);

        const parsedResponse = JSON.parse(cleanText);
        
        // Validate the response structure
        if (!parsedResponse || typeof parsedResponse !== 'object') {
          throw new Error('Invalid response structure');
        }

        // Map AI vehicle type to internal type
        const internalType = mapAIVehicleTypeToInternal(parsedResponse.type);

        return {
          plateNumber: parsedResponse.plateNumber || '',
          carDetails: {
            make: parsedResponse.make || '',
            model: parsedResponse.model || '',
            color: parsedResponse.color || '',
            type: parsedResponse.type || '',
            internalType
          },
          confidence: typeof parsedResponse.confidence === 'number' ? parsedResponse.confidence : 0.8
        };
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        throw new AppError('Failed to parse car details', 500);
      }    } catch (error: any) {
      console.error('Detailed error:', {
        name: error?.name || 'Unknown error',
        message: error?.message || 'No error message',
        stack: error?.stack,
        response: error?.response?.data
      });
      
      // More specific error messages based on the error type
      if (error instanceof Error) {
        throw new AppError(`Failed to process car image: ${error.message}`, 500);
      }
      throw new AppError('Failed to process car image', 500);
    }
  }
}