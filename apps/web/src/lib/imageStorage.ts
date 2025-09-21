// Image storage utilities for handling generated images
// This is a placeholder - implement based on your storage service

export interface ImageUploadResult {
  url: string;
  publicId?: string;
}

// Example implementation for Cloudinary
export async function uploadImageToCloudinary(imageUrl: string, prompt: string): Promise<ImageUploadResult | null> {
  try {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudinaryUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudinaryUrl || !cloudinaryUploadPreset) {
      console.error('Cloudinary configuration missing');
      return null;
    }
    
    // Download the image from OpenAI
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from OpenAI');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', `data:image/png;base64,${base64Image}`);
    formData.append('upload_preset', cloudinaryUploadPreset);
    formData.append('folder', 'daily-flashcard-images');
    formData.append('public_id', `daily-${Date.now()}`);
    
    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }
    
    const uploadData = await uploadResponse.json();
    
    return {
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return null;
  }
}

// Example implementation for AWS S3
export async function uploadImageToS3(imageUrl: string, prompt: string): Promise<ImageUploadResult | null> {
  try {
    // This would require AWS SDK setup
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3();
    
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from OpenAI');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to S3
    // const uploadParams = {
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: `daily-images/${Date.now()}-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`,
    //   Body: Buffer.from(imageBuffer),
    //   ContentType: 'image/png',
    //   ACL: 'public-read'
    // };
    
    // const uploadResult = await s3.upload(uploadParams).promise();
    // return { url: uploadResult.Location };
    
    console.log('S3 upload not implemented yet');
    return null;
  } catch (error) {
    console.error('S3 upload failed:', error);
    return null;
  }
}

// Generic image upload function
export async function uploadGeneratedImage(imageUrl: string, prompt: string): Promise<ImageUploadResult | null> {
  const storageService = process.env.IMAGE_STORAGE_SERVICE || 'cloudinary';
  
  switch (storageService) {
    case 'cloudinary':
      return await uploadImageToCloudinary(imageUrl, prompt);
    case 's3':
      return await uploadImageToS3(imageUrl, prompt);
    default:
      console.error('Unknown storage service:', storageService);
      return null;
  }
}
