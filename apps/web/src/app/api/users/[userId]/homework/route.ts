import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { lessonId, content } = await request.json();

    if (!lessonId || !content) {
      return NextResponse.json(
        { error: 'Lesson ID and content are required' },
        { status: 400 }
      );
    }

    console.log(`Submitting homework for user ${userId}, lesson ${lessonId}`);

    // Check if homework already exists for this lesson
    const existingHomeworkQuery = await adminDb
      .collection('users')
      .doc(userId)
      .collection('homework')
      .where('lessonId', '==', lessonId)
      .get();

    const now = new Date().toISOString();

    if (!existingHomeworkQuery.empty) {
      // Update existing homework
      const existingDoc = existingHomeworkQuery.docs[0];
      await existingDoc.ref.update({
        content: content.trim(),
        submittedAt: now,
        updatedAt: now,
      });

      console.log(`Updated existing homework for user ${userId}, lesson ${lessonId}`);

      return NextResponse.json({
        id: existingDoc.id,
        lessonId,
        studentId: userId,
        content: content.trim(),
        submittedAt: now,
        status: 'submitted',
      });
    } else {
      // Create new homework submission
      const homeworkRef = await adminDb
        .collection('users')
        .doc(userId)
        .collection('homework')
        .add({
          lessonId,
          studentId: userId,
          content: content.trim(),
          submittedAt: now,
          status: 'submitted',
          createdAt: now,
          updatedAt: now,
        });

      console.log(`Created new homework for user ${userId}, lesson ${lessonId}`);

      return NextResponse.json({
        id: homeworkRef.id,
        lessonId,
        studentId: userId,
        content: content.trim(),
        submittedAt: now,
        status: 'submitted',
      });
    }
  } catch (error) {
    console.error('Error submitting homework:', error);
    return NextResponse.json(
      { error: 'Failed to submit homework' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (lessonId) {
      // Get specific homework for a lesson
      const homeworkQuery = await adminDb
        .collection('users')
        .doc(userId)
        .collection('homework')
        .where('lessonId', '==', lessonId)
        .get();

      if (homeworkQuery.empty) {
        return NextResponse.json(null);
      }

      const homeworkDoc = homeworkQuery.docs[0];
      return NextResponse.json({
        id: homeworkDoc.id,
        ...homeworkDoc.data(),
      });
    } else {
      // Get all homework for the user
      const homeworkQuery = await adminDb
        .collection('users')
        .doc(userId)
        .collection('homework')
        .orderBy('submittedAt', 'desc')
        .get();

      const homework = homeworkQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json(homework);
    }
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}
