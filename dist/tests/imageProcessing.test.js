"use strict";
// import request from 'supertest';
// import app from '../server';
// import path from 'path';
// import fs from 'fs';
// import { generateTestToken } from '../utils/Jwt';
// describe('Image Processing API', () => {
//   let token: string;
//   beforeAll(async () => {
//     // Generate a test token
//     token = generateTestToken({ id: 'test-user-id' });
//   });
//   describe('POST /api/v1/parking/process-image', () => {
//     it('should process a valid car image', async () => {
//       const imagePath = path.join(__dirname, '../test-assets/sample-car.jpg');
//       const response = await request(app)
//         .post('/api/v1/parking/process-image')
//         .set('Authorization', `Bearer ${token}`)
//         .attach('image', imagePath);
//       expect(response.status).toBe(200);
//       expect(response.body.status).toBe('success');
//       expect(response.body.data).toHaveProperty('plateNumber');
//       expect(response.body.data).toHaveProperty('carDetails');
//       expect(response.body.data).toHaveProperty('confidence');
//     });
//     it('should reject when no image is provided', async () => {
//       const response = await request(app)
//         .post('/api/v1/parking/process-image')
//         .set('Authorization', `Bearer ${token}`);
//       expect(response.status).toBe(400);
//       expect(response.body.status).toBe('error');
//       expect(response.body.message).toBe('No image file provided');
//     });
//     it('should reject non-image files', async () => {
//       const textFilePath = path.join(__dirname, '../test-assets/test.txt');
//       fs.writeFileSync(textFilePath, 'test content');
//       const response = await request(app)
//         .post('/api/v1/parking/process-image')
//         .set('Authorization', `Bearer ${token}`)
//         .attach('image', textFilePath);
//       expect(response.status).toBe(400);
//       expect(response.body.status).toBe('error');
//       expect(response.body.message).toBe('Only image files are allowed!');
//       fs.unlinkSync(textFilePath);
//     });
//     it('should require authentication', async () => {
//       const imagePath = path.join(__dirname, '../test-assets/sample-car.jpg');
//       const response = await request(app)
//         .post('/api/v1/parking/process-image')
//         .attach('image', imagePath);
//       expect(response.status).toBe(401);
//     });
//   });
// });
//# sourceMappingURL=imageProcessing.test.js.map