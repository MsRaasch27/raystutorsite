// Test script for Cloudinary setup
// Run with: node test-cloudinary.js

const fs = require('fs');
const path = require('path');

async function testCloudinaryUpload() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  
  console.log('Testing Cloudinary configuration...');
  console.log('Cloudinary URL:', cloudinaryUrl);
  console.log('Upload Preset:', uploadPreset);
  
  if (!cloudinaryUrl || !uploadPreset) {
    console.error('❌ Missing environment variables!');
    console.log('Make sure you have CLOUDINARY_URL and CLOUDINARY_UPLOAD_PRESET set');
    return;
  }
  
  // Test with a simple image (you can use any image file)
  const testImagePath = path.join(__dirname, 'public', 'fujimoto.png');
  
  if (!fs.existsSync(testImagePath)) {
    console.error('❌ Test image not found at:', testImagePath);
    console.log('Using a different test approach...');
    
    // Test with a base64 encoded 1x1 pixel
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    try {
      const formData = new FormData();
      formData.append('file', `data:image/png;base64,${testImageBase64}`);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'test-uploads');
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cloudinary upload successful!');
        console.log('Uploaded image URL:', result.secure_url);
        console.log('Public ID:', result.public_id);
      } else {
        const error = await response.text();
        console.error('❌ Upload failed:', response.status, error);
      }
    } catch (error) {
      console.error('❌ Upload error:', error.message);
    }
  } else {
    console.log('✅ Test image found, uploading...');
    
    try {
      const imageBuffer = fs.readFileSync(testImagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const formData = new FormData();
      formData.append('file', `data:image/png;base64,${base64Image}`);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'test-uploads');
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cloudinary upload successful!');
        console.log('Uploaded image URL:', result.secure_url);
        console.log('Public ID:', result.public_id);
      } else {
        const error = await response.text();
        console.error('❌ Upload failed:', response.status, error);
      }
    } catch (error) {
      console.error('❌ Upload error:', error.message);
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testCloudinaryUpload();
