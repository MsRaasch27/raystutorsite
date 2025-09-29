import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { studentEmail } = await request.json();

    if (!studentEmail) {
      return NextResponse.json(
        { error: 'Student email is required' },
        { status: 400 }
      );
    }

    console.log(`Initializing student lessons for: ${studentEmail}`);

    // Find the student by email
    const studentsSnapshot = await adminDb
      .collection('users')
      .where('email', '==', studentEmail.trim().toLowerCase())
      .get();

    if (studentsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentDoc = studentsSnapshot.docs[0];
    const studentId = studentDoc.id;

    // Get master lessons
    const masterLessonsSnapshot = await adminDb
      .collection('masterLessons')
      .orderBy('index', 'asc')
      .get();

    if (masterLessonsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Master lessons not found' },
        { status: 404 }
      );
    }

    // Clear existing student lessons
    const existingLessonsSnapshot = await adminDb
      .collection('users')
      .doc(studentId)
      .collection('lessons')
      .get();

    const batch = adminDb.batch();
    existingLessonsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Create student lessons from master
    const addBatch = adminDb.batch();
    const now = new Date();

    masterLessonsSnapshot.docs.forEach((doc) => {
      const masterLesson = doc.data();
      const studentLessonRef = adminDb
        .collection('users')
        .doc(studentId)
        .collection('lessons')
        .doc();

      addBatch.set(studentLessonRef, {
        ...masterLesson,
        completed: false,
        debriefNotes: '',
        studentId: studentId,
        createdAt: now,
        updatedAt: now,
      });
    });

    await addBatch.commit();

    console.log(`Successfully initialized ${masterLessonsSnapshot.docs.length} lessons for student ${studentEmail}`);

    return NextResponse.json({
      success: true,
      message: `Initialized ${masterLessonsSnapshot.docs.length} lessons for ${studentEmail}`,
      count: masterLessonsSnapshot.docs.length,
    });
  } catch (error) {
    console.error('Error initializing student lessons:', error);
    return NextResponse.json(
      { error: 'Failed to initialize student lessons' },
      { status: 500 }
    );
  }
}
