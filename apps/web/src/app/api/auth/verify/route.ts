import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { OAuth2Client } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Google ID token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    const { email, name, picture } = payload;

    if (!email) {
      return NextResponse.json({ error: 'No email in token' }, { status: 401 });
    }

    const userId = email.trim().toLowerCase();

    // Get user data from Firestore
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return NextResponse.json({
          id: userId,
          email: email,
          name: name || userData?.name || '',
          picture: picture || userData?.picture || '',
          ...userData
        });
      } else {
        // User doesn't exist in Firestore, return basic info
        return NextResponse.json({
          id: userId,
          email: email,
          name: name || '',
          picture: picture || '',
        });
      }
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // Return basic user info even if Firestore fails
      return NextResponse.json({
        id: userId,
        email: email,
        name: name || '',
        picture: picture || '',
      });
    }

  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
