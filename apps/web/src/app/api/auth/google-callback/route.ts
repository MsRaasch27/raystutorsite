import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    // Debug environment variables
    console.log("Environment check:", {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0
    });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://enchantedenglish.org';
    const redirectUri = `${baseUrl}/auth/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials");
      return NextResponse.json({ error: "OAuth configuration error" }, { status: 500 });
    }

    console.log("Token exchange request:", {
      code: code.substring(0, 10) + "...",
      clientId: clientId.substring(0, 10) + "...",
      redirectUri
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      return NextResponse.json({ 
        error: "Failed to exchange code for token", 
        details: errorText,
        status: tokenResponse.status 
      }, { status: 500 });
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

    // Get the ID token from the token response
    const { id_token } = tokenData;

    return NextResponse.json({ 
      ok: true, 
      userId,
      name,
      email,
      photo: picture,
      idToken: id_token
    });

  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
