import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching custom image prompt for student ${studentId}`);

    // Get the student's document
    const studentDoc = await adminDb
      .collection('users')
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const customImagePrompt = studentData?.customImagePrompt || '';
    const imagePromptUpdatedAt = studentData?.imagePromptUpdatedAt || null;

    console.log(`Found custom image prompt for student ${studentId}: ${customImagePrompt}`);

    return NextResponse.json({
      success: true,
      customImagePrompt,
      imagePromptUpdatedAt
    });
  } catch (error) {
    console.error('Error fetching student image prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image prompt' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, prompt } = await request.json();

    if (!studentId || !prompt) {
      return NextResponse.json(
        { error: 'Student ID and prompt are required' },
        { status: 400 }
      );
    }

    console.log(`Setting custom image prompt for student ${studentId}: ${prompt}`);

    // Store the student-specific prompt in Firestore
    await adminDb
      .collection('users')
      .doc(studentId)
      .update({
        customImagePrompt: prompt.trim(),
        imagePromptUpdatedAt: new Date().toISOString()
      });

    console.log(`Successfully stored custom image prompt for student ${studentId}`);

    return NextResponse.json({
      success: true,
      message: 'Custom image prompt set successfully',
      studentId,
      prompt: prompt.trim()
    });
  } catch (error) {
    console.error('Error setting student image prompt:', error);
    return NextResponse.json(
      { error: 'Failed to set image prompt' },
      { status: 500 }
    );
  }
}
