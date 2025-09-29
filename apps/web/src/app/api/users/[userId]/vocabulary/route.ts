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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { english } = await request.json();

    if (!userId || !english) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if word already exists
    const existingWord = await adminDb
      .collection('users')
      .doc(userId)
      .collection('vocabulary')
      .where('english', '==', english.toLowerCase().trim())
      .get();

    if (!existingWord.empty) {
      return NextResponse.json(
        { error: 'duplicate', message: 'This word already exists in your vocabulary' },
        { status: 409 }
      );
    }

    // Add new vocabulary word
    const newWord = {
      english: english.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb
      .collection('users')
      .doc(userId)
      .collection('vocabulary')
      .add(newWord);
    
    return NextResponse.json({
      id: docRef.id,
      ...newWord
    });
  } catch (error) {
    console.error('Error adding vocabulary word:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
