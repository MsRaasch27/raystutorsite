import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for demo (in production, use Redis or database)
const dailyImageCache = new Map<string, {
  imageUrl: string;
  prompt: string;
  source: 'ai-generated' | 'fallback';
  date: string;
  generatedAt: string;
}>();

// Default prompts for each day of the week
const DEFAULT_PROMPTS = [
  "A magical forest with glowing mushrooms and fairy lights",
  "A cozy wizard's study with floating books and potions",
  "A mystical mountain peak with ancient ruins",
  "A serene lake reflecting a starry night sky",
  "A bustling medieval marketplace with colorful stalls",
  "A peaceful garden with talking flowers and butterflies",
  "A mysterious library with endless shelves and floating candles"
];

// Fallback images
const FALLBACK_IMAGES = [
  '/fujimoto.png',
  '/gothic_full_cropped.png',
  '/wallpaper.png'
];

function getDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

function getDayOfWeek(): number {
  return new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
}

async function generateOrGetDailyImage(): Promise<{
  imageUrl: string;
  prompt: string;
  source: 'ai-generated' | 'fallback';
  date: string;
  generatedAt: string;
}> {
  const dateKey = getDateKey();
  
  // Check if we already have today's image
  if (dailyImageCache.has(dateKey)) {
    return dailyImageCache.get(dateKey)!;
  }
  
  // Generate new image for today
  const dayOfWeek = getDayOfWeek();
  const prompt = DEFAULT_PROMPTS[dayOfWeek];
  
  try {
    // Try to generate AI image
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/generate-daily-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        date: dateKey
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      const dailyImage = {
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        source: result.source,
        date: dateKey,
        generatedAt: new Date().toISOString()
      };
      
      // Cache the result
      dailyImageCache.set(dateKey, dailyImage);
      
      return dailyImage;
    }
  } catch (error) {
    console.error('Failed to generate daily image:', error);
  }
  
  // Fallback to static image
  const randomFallback = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  
  const fallbackImage = {
    imageUrl: randomFallback,
    prompt: prompt,
    source: 'fallback' as const,
    date: dateKey,
    generatedAt: new Date().toISOString()
  };
  
  // Cache the fallback
  dailyImageCache.set(dateKey, fallbackImage);
  
  return fallbackImage;
}

export async function GET() {
  try {
    const dailyImage = await generateOrGetDailyImage();
    
    return NextResponse.json({
      success: true,
      ...dailyImage
    });
  } catch (error) {
    console.error('Error getting daily image:', error);
    
    // Return a fallback even if everything fails
    const randomFallback = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    
    return NextResponse.json({
      success: true,
      imageUrl: randomFallback,
      prompt: "A magical learning environment",
      source: 'fallback',
      date: getDateKey(),
      generatedAt: new Date().toISOString()
    });
  }
}

// Admin endpoint to set custom prompt for today
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    const dateKey = getDateKey();
    
    // Generate image with custom prompt
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/generate-daily-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        date: dateKey
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      const dailyImage = {
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        source: result.source,
        date: dateKey,
        generatedAt: new Date().toISOString()
      };
      
      // Update cache
      dailyImageCache.set(dateKey, dailyImage);
      
      return NextResponse.json({
        success: true,
        message: 'Daily image updated successfully',
        ...dailyImage
      });
    } else {
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    console.error('Error updating daily image:', error);
    
    return NextResponse.json(
      { error: 'Failed to update daily image' },
      { status: 500 }
    );
  }
}
