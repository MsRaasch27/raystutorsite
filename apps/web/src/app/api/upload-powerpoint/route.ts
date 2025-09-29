import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'raystutorsite',
});

const bucketName = 'raystutorsite-powerpoints';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const originalUrl = formData.get('originalUrl') as string;

    if (!file || !originalUrl) {
      return NextResponse.json(
        { error: 'File and original URL are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.pptx')) {
      return NextResponse.json(
        { error: 'Only PowerPoint files (.pptx) are allowed' },
        { status: 400 }
      );
    }

    // Extract file path from the original Google Cloud Storage URL
    const urlPattern = /https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/;
    const match = originalUrl.match(urlPattern);
    
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid original URL format' },
        { status: 400 }
      );
    }

    const fileName = match[1];
    const storageFile = storage.bucket(bucketName).file(fileName);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload the file to the same location (overwriting the original)
    await storageFile.save(fileBuffer, {
      metadata: {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // Make the file publicly accessible
    await storageFile.makePublic();

    // Return the same URL (since we overwrote the original)
    const updatedUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'PowerPoint updated successfully',
      url: updatedUrl,
    });

  } catch (error) {
    console.error('Error uploading PowerPoint:', error);
    return NextResponse.json(
      { error: 'Failed to upload PowerPoint' },
      { status: 500 }
    );
  }
}
