import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const details = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }

    // Update lesson details in Firestore
    await adminDb.collection('lessons').doc(lessonId).update({
      details: details,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving lesson details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


