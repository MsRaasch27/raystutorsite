import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log(`Fetching master lessons from Firestore - page ${page}, limit ${limit}`);

    // Get total count first
    const countSnapshot = await adminDb.collection('masterLessons').get();
    const totalCount = countSnapshot.size;

    // Get paginated master lessons from Firestore
    let query = adminDb.collection('masterLessons').orderBy('index');
    
    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await adminDb.collection('masterLessons').orderBy('index').limit(offset).get();
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }
    
    const masterLessonsSnapshot = await query.limit(limit).get();
    
    const masterLessons = masterLessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    console.log(`Found ${masterLessons.length} master lessons (${totalCount} total, page ${page}/${totalPages})`);

    return NextResponse.json({ 
      masterLessons,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching master lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master lessons' },
      { status: 500 }
    );
  }
}
