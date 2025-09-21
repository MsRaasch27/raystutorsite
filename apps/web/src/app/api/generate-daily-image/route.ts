import { NextRequest, NextResponse } from 'next/server';
import { uploadGeneratedImage } from '../../../lib/imageStorage';

// Fallback images to use if AI generation fails
const FALLBACK_IMAGES = [
  '/fujimoto.png',
  '/gothic_full_cropped.png',
  '/wallpaper.png'
];

// OpenAI DALL-E image generation service
async function generateAIImage(prompt: string): Promise<string | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return null;
    }
    
    console.log(`Generating image for prompt: "${prompt}"`);
    
    // Call OpenAI DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      return null;
    }
    
    const data = await response.json();
    const imageUrl = data.data[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL returned from OpenAI');
      return null;
    }
    
    // Upload the image to your storage service to avoid expiration
    const uploadResult = await uploadGeneratedImage(imageUrl, prompt);
    
    if (uploadResult) {
      console.log('Image uploaded successfully:', uploadResult.url);
      return uploadResult.url;
    } else {
      console.warn('Image upload failed, using temporary OpenAI URL');
      // Fallback to temporary URL if upload fails
      return imageUrl;
    }
    
  } catch (error) {
    console.error('AI image generation failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Try to generate AI image
    const generatedImageUrl = await generateAIImage(prompt);
    
    if (generatedImageUrl) {
      // Success - return the generated image
      return NextResponse.json({
        success: true,
        imageUrl: generatedImageUrl,
        source: 'ai-generated',
        prompt: prompt
      });
    } else {
      // Fallback to static images
      const randomFallback = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      
      return NextResponse.json({
        success: true,
        imageUrl: randomFallback,
        source: 'fallback',
        prompt: prompt,
        fallbackReason: 'AI generation failed'
      });
    }
  } catch (error) {
    console.error('Error in generate-daily-image API:', error);
    
    // Return a fallback image even if everything fails
    const randomFallback = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    
    return NextResponse.json({
      success: true,
      imageUrl: randomFallback,
      source: 'fallback',
      fallbackReason: 'API error'
    });
  }
}
