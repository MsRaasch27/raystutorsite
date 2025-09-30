import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get flashcard progress from Firestore (using same pattern as Firebase Functions)
    const progressSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('flashcardProgress')
      .get();

    const progress = progressSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        wordId: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for proper JSON serialization
        lastReviewed: data.lastReviewed?.toDate?.()?.toISOString() || data.lastReviewed,
        nextReview: data.nextReview?.toDate?.()?.toISOString() || data.nextReview,
      };
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching flashcard progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
