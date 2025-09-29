import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; wordId: string }> }
) {
  try {
    const { userId, wordId } = await params;
    const { difficulty } = await request.json();

    if (!userId || !wordId || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // Get user's custom intervals
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customIntervals = userData?.customIntervals || {
      easy: 7,
      medium: 3,
      hard: 1
    };

    // Calculate next review date based on custom intervals
    const now = new Date();
    let nextReviewDays = customIntervals.hard; // Default for hard
    
    switch (difficulty) {
      case 'easy':
        nextReviewDays = customIntervals.easy;
        break;
      case 'medium':
        nextReviewDays = customIntervals.medium;
        break;
      case 'hard':
        nextReviewDays = customIntervals.hard;
        break;
    }

    const nextReviewDate = new Date(now.getTime() + nextReviewDays * 24 * 60 * 60 * 1000);

    // Update or create flashcard progress (using same pattern as Firebase Functions)
    const progressRef = adminDb.collection('users').doc(userId).collection('flashcardProgress').doc(wordId);
    
    // Get current progress to increment review count
    const currentDoc = await progressRef.get();
    const currentData = currentDoc.exists ? currentDoc.data() : null;
    
    await progressRef.set({
      wordId,
      difficulty,
      interval: nextReviewDays,
      lastReviewed: now.toISOString(),
      nextReview: nextReviewDate.toISOString(),
      reviewCount: (currentData?.reviewCount || 0) + 1,
      updatedAt: now.toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rating flashcard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
