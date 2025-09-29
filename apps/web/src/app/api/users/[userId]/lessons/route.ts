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

    console.log('Fetching lessons for user:', userId);

    // Get lessons from Firestore (stored in user subcollection)
    const lessonsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('lessons')
      .orderBy('index', 'asc')
      .get();

    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${lessons.length} lessons for user ${userId}`);

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}
