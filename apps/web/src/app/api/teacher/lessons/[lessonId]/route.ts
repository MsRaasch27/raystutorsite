import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }

    // Get lesson details from Firestore
    const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const lessonData = lessonDoc.data();
    
    return NextResponse.json({
      details: lessonData?.details || {}
    });

  } catch (error) {
    console.error('Error fetching lesson details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

