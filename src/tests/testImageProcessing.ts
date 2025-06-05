import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api/v1';
const TOKEN = 'your-jwt-token'; // Replace with actual token

async function testImageProcessing(imagePath: string) {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.post(`${API_URL}/parking/process-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage example
const imagePath = path.join(__dirname, '..', 'test-assets', 'sample-car.jpg');
testImageProcessing(imagePath);
