import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language = "en-US" } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    console.log(`Generating text-to-speech for: "${text}" in language: ${language}`);

    // Call the Firebase Function for text-to-speech
    const firebaseFunctionUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/text-to-speech`;
    
    const response = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase Function error:', errorText);
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully generated text-to-speech audio');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in text-to-speech API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
