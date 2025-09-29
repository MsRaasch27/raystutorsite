import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string; homeworkId: string }> }) {
  try {
    const { userId, homeworkId } = await params;

    const homeworkDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('homework')
      .doc(homeworkId)
      .get();

    if (!homeworkDoc.exists) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: homeworkDoc.id,
      ...homeworkDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string; homeworkId: string }> }) {
  try {
    const { userId, homeworkId } = await params;
    const { grade, feedback, status } = await request.json();

    console.log(`Updating homework ${homeworkId} for user ${userId}`);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (grade !== undefined) updateData.grade = grade;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (status !== undefined) updateData.status = status;

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('homework')
      .doc(homeworkId)
      .update(updateData);

    console.log(`Updated homework ${homeworkId} for user ${userId}`);

    return NextResponse.json({ message: 'Homework updated successfully' });
  } catch (error) {
    console.error('Error updating homework:', error);
    return NextResponse.json(
      { error: 'Failed to update homework' },
      { status: 500 }
    );
  }
}
