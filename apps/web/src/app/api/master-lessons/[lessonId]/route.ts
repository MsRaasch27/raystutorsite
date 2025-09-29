import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const body = await request.json();

    console.log(`Updating master lesson ${lessonId}:`, body);

    // Update the lesson in Firestore
    await adminDb.collection('masterLessons').doc(lessonId).update({
      ...body,
      updatedAt: new Date(),
    });

    console.log(`Successfully updated master lesson ${lessonId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating master lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update master lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    console.log(`Deleting master lesson ${lessonId}`);

    // Delete the lesson from Firestore
    await adminDb.collection('masterLessons').doc(lessonId).delete();

    console.log(`Successfully deleted master lesson ${lessonId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting master lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete master lesson' },
      { status: 500 }
    );
  }
}
