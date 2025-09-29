import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; lessonId: string }> }
) {
  try {
    const { userId, lessonId } = await params;
    const updateData = await request.json();

    console.log('Updating lesson:', { userId, lessonId, updateData });

    if (!userId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Update lesson in user subcollection
    const lessonRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('lessons')
      .doc(lessonId);
    
    // Verify the lesson exists
    const lessonDoc = await lessonRef.get();
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    await lessonRef.update({
      ...updateData,
      updatedAt: new Date().toISOString()
    });

    console.log('Successfully updated lesson:', lessonId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
