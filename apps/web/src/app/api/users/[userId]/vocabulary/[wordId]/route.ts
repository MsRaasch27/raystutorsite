import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; wordId: string }> }
) {
  try {
    const { userId, wordId } = await params;
    const updateData = await request.json();

    console.log('Updating vocabulary word:', { userId, wordId, updateData });

    if (!userId || !wordId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Update vocabulary word in user subcollection
    const wordRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('vocabulary')
      .doc(wordId);
    
    // Verify the word exists
    const wordDoc = await wordRef.get();
    if (!wordDoc.exists) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }

    await wordRef.update({
      ...updateData,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating vocabulary word:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; wordId: string }> }
) {
  try {
    const { userId, wordId } = await params;

    if (!userId || !wordId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Delete vocabulary word from user subcollection
    const wordRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('vocabulary')
      .doc(wordId);
    
    // Verify the word exists
    const wordDoc = await wordRef.get();
    if (!wordDoc.exists) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }

    await wordRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vocabulary word:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
