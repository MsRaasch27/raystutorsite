import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("User info fetch failed:", await userInfoResponse.text());
      return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 });
    }

    const userInfo = await userInfoResponse.json();
    const { id, email, name, picture } = userInfo;

    if (!email) {
      return NextResponse.json({ error: "No email provided by Google" }, { status: 400 });
    }

    const userId = email.trim().toLowerCase();
    const now = new Date();

    // Save user to Firestore
    await adminDb.collection("users").doc(userId).set(
      {
        name: name || null,
        email: email,
        photo: picture || null,
        googleId: id || null,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ 
      ok: true, 
      userId,
      name,
      email,
      photo: picture 
    });

  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
