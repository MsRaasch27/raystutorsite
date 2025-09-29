import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, intervals } = await request.json();

    if (!userId || !intervals) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate intervals
    const { easy, medium, hard } = intervals;
    if (typeof easy !== 'number' || typeof medium !== 'number' || typeof hard !== 'number') {
      return NextResponse.json(
        { error: 'Invalid interval values' },
        { status: 400 }
      );
    }

    if (easy < 1 || medium < 1 || hard < 1 || easy > 30 || medium > 30 || hard > 30) {
      return NextResponse.json(
        { error: 'Intervals must be between 1 and 30 days' },
        { status: 400 }
      );
    }

    // Save custom intervals to Firestore
    await adminDb.collection('users').doc(userId).set({
      customIntervals: {
        easy,
        medium,
        hard,
        updatedAt: new Date().toISOString(),
      }
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving custom intervals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get custom intervals from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Return default intervals if user doesn't exist
      return NextResponse.json({
        intervals: {
          easy: 7,
          medium: 3,
          hard: 1,
        }
      });
    }

    const userData = userDoc.data();
    const customIntervals = userData?.customIntervals;

    if (!customIntervals) {
      // Return default intervals if no custom intervals set
      return NextResponse.json({
        intervals: {
          easy: 7,
          medium: 3,
          hard: 1,
        }
      });
    }

    return NextResponse.json({
      intervals: {
        easy: customIntervals.easy || 7,
        medium: customIntervals.medium || 3,
        hard: customIntervals.hard || 1,
      }
    });
  } catch (error) {
    console.error('Error fetching custom intervals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
