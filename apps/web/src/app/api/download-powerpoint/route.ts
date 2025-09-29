import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'raystutorsite',
});

const bucketName = 'raystutorsite-powerpoints';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    // Extract file path from the Google Cloud Storage URL
    const urlPattern = /https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/;
    const match = fileUrl.match(urlPattern);
    
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid Google Cloud Storage URL' },
        { status: 400 }
      );
    }

    const fileName = match[1];
    const file = storage.bucket(bucketName).file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Download the file
    const [fileBuffer] = await file.download();

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(fileBuffer);

    // Return the file as a download
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName.split('/').pop()}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading PowerPoint:', error);
    return NextResponse.json(
      { error: 'Failed to download PowerPoint' },
      { status: 500 }
    );
  }
}
