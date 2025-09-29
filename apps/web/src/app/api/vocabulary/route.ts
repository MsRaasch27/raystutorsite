import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

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

    // Get vocabulary from Firestore (stored in user subcollection)
    const vocabSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('vocabulary')
      .orderBy('createdAt', 'asc')
      .get();

    const words = vocabSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
