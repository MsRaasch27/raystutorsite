import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log(`Starting flashcard data cleanup for user: ${userId}`);

    // Get all flashcard progress records for the user
    const progressSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('flashcardProgress')
      .get();

    let fixedCount = 0;
    const batch = adminDb.batch();

    for (const doc of progressSnapshot.docs) {
      const data = doc.data();
      const docRef = doc.ref;
      
      // Check if dates are invalid
      const lastReviewed = data.lastReviewed;
      const nextReview = data.nextReview;
      const interval = data.interval;
      
      let needsFix = false;
      let reason = '';
      
      // Check if dates are invalid (null, undefined, or invalid Date objects)
      if (!lastReviewed || !nextReview) {
        needsFix = true;
        reason = 'Missing dates';
      } else {
        // Try to parse the dates
        const lastReviewedDate = new Date(lastReviewed);
        const nextReviewDate = new Date(nextReview);
        
        if (isNaN(lastReviewedDate.getTime()) || isNaN(nextReviewDate.getTime())) {
          needsFix = true;
          reason = 'Invalid dates';
        } else {
          // Check if next review date is in the future (should be due now)
          const now = new Date();
          if (nextReviewDate > now) {
            needsFix = true;
            reason = 'Future next review date';
          }
          
          // Check if interval is too high (should be max 3 days)
          if (interval && interval > 3) {
            needsFix = true;
            reason = `Interval too high (${interval} days)`;
          }
        }
      }
      
      if (needsFix) {
        console.log(`Fixing ${reason} for word: ${data.wordId}`);
        
        // Set new valid dates - make it due now
        const now = new Date();
        const nextReviewDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now
        
        batch.update(docRef, {
          lastReviewed: now.toISOString(),
          nextReview: nextReviewDate.toISOString(),
          interval: 1, // Reset to 1 day interval
          updatedAt: now.toISOString()
        });
        
        fixedCount++;
      }
    }

    // Commit the batch update
    if (fixedCount > 0) {
      await batch.commit();
      console.log(`Fixed ${fixedCount} corrupted flashcard progress records`);
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} corrupted flashcard progress records`,
      fixedCount,
      totalRecords: progressSnapshot.docs.length
    });

  } catch (error) {
    console.error('Error fixing flashcard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
