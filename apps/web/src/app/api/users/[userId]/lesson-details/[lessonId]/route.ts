import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; lessonId: string }> }
) {
  try {
    const { userId, lessonId } = await params;

    if (!userId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Try to get lesson details from the lessonDetails collection
    const lessonDoc = await adminDb.collection('lessonDetails').doc(lessonId).get();
    
    if (!lessonDoc.exists) {
      // Return empty details instead of 404 - this allows the student dashboard to work
      // even if lesson details haven't been created yet
      return NextResponse.json({
        details: {}
      });
    }

    const lessonData = lessonDoc.data();
    
    // Debug logging
    console.log('Lesson data for', lessonId, ':', lessonData);
    
    // Return the lesson data directly, not nested under 'details'
    return NextResponse.json({
      details: lessonData || {}
    });

  } catch (error) {
    console.error('Error fetching lesson details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
