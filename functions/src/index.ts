/* eslint-disable
  @typescript-eslint/no-misused-promises,
  object-curly-spacing,
  indent,
  operator-linebreak,
  max-len
*/
import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { google } from "googleapis";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

setGlobalOptions({ maxInstances: 10 });
const S_CALENDAR_ID = defineSecret("GOOGLE_CALENDAR_ID");
const S_VOCAB_SHEET_ID = defineSecret("GOOGLE_VOCAB_SHEET_ID");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5000",
      "http://localhost:5000",
      "https://raystutorsite.web.app",
      "https://raystutorsite.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ----- shared router -----
// eslint-disable-next-line new-cap
const apiRouter = express.Router();

// Health
apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "production",
  });
});

// Persist form submission
apiRouter.post(
  "/hooks/form-submission",
  async (req: Request, res: Response) => {
    try {
      const { name, email, sheetName, answers } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Missing email in payload" });
      }
      const userId = String(email).trim().toLowerCase();

      // Extract age from answers if available
      const age = answers && answers["Your Age"] ?
        answers["Your Age"] :
        null;

      // Extract goals from answers if available
      const goals = answers && answers["Your Language Goals"] ?
        answers["Your Language Goals"] :
        null;

      // Extract frequency from answers if available
      const frequency = answers && answers["How Often Would You Like to Take Lessons"] ?
      answers["How Often Would You Like to Take Lessons"] :
      null;

      // Extract preferredtime from answers if available
      const preferredtime = answers && answers["Preferred Lesson Times"] ?
      answers["Preferred Lesson Times"] :
      null;

      // Extract timezone from answers if available
      const timezone = answers && answers["Your Time Zone"] ?
      answers["Your Time Zone"] :
      null;

      // Extract photo from answers if available
      const photo = answers && answers["Your Photo"] ?
      answers["Your Photo"] :
      null;

      const now = new Date();
      await db.collection("users").doc(userId).set(
        {
          name: name || null,
          email: userId,
          sheetName: sheetName || null,
          age: age,
          goals: goals,
          frequency: frequency,
          preferredtime: preferredtime,
          timezone: timezone,
          photo: photo,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true, userId });
    } catch (err: unknown) {
      console.error("form-submission error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Store assessment responses
apiRouter.post(
  "/hooks/assessment-submission",
  async (req: Request, res: Response) => {
    try {
      const { email, submittedAt, answers } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Missing email in payload" });
      }
      const userId = String(email).trim().toLowerCase();

      const now = new Date();
      const assessmentId = `${userId}_${now.getTime()}`;

      await db.collection("assessments").doc(assessmentId).set({
        userId: userId,
        email: userId,
        submittedAt: submittedAt || now.toISOString(),
        answers: answers || {},
        createdAt: now,
      });

      return res.status(200).json({ ok: true, assessmentId, userId });
    } catch (err: unknown) {
      console.error("assessment-submission error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Read user (for Student page)
apiRouter.get(
  "/users/:id",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const snap = await db.collection("users").doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: "not found" });
      return res.json({ id, ...snap.data() });
    } catch (err: unknown) {
      console.error("get user error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Get user's assessments
apiRouter.get(
  "/users/:id/assessments",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const assessmentsSnap = await db.collection("assessments")
        .where("userId", "==", id)
        .orderBy("createdAt", "desc")
        .get();

      const assessments = assessmentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.json({ assessments });
    } catch (err: unknown) {
      console.error("get assessments error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Get vocabulary words from Google Sheets
apiRouter.get(
  "/vocabulary",
  async (req: Request, res: Response) => {
    try {
      // Check if a specific user ID is provided
      const userId = req.query.userId as string;
      let sheetId: string | undefined;

      try {
        sheetId = process.env.GOOGLE_VOCAB_SHEET_ID || S_VOCAB_SHEET_ID.value();
      } catch (err) {
        console.warn("Default vocabulary sheet not configured:", err);
      }

      // If a user ID is provided, check if they have a custom vocabulary sheet
      if (userId) {
        try {
          const userDoc = await db.collection("users").doc(userId.toLowerCase()).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            // Check if user has a custom vocabulary sheet ID
            if (userData?.vocabularySheetId) {
              sheetId = userData.vocabularySheetId;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch user vocabulary sheet, using default:", err);
        }
      }

      if (!sheetId) {
        return res.status(500).json({ error: "No vocabulary sheet configured. Please set up a default sheet or configure a personal vocabulary sheet." });
      }

      // Auth as the function's service account
      const auth = await google.auth.getClient({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
      const sheets = google.sheets({ version: "v4", auth });

      // Fetch data from the sheet (assuming columns: English | Thai | Part of Speech | Example)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "A:D", // Adjust range based on your sheet structure
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return res.json({ words: [] });
      }

      // Skip header row and map to vocabulary objects
      const words = rows.slice(1).map((row, index) => ({
        id: `word_${index + 1}`,
        english: row[0] || "",
        thai: row[1] || "",
        partOfSpeech: row[2] || "",
        example: row[3] || "",
      }));

      return res.json({ words });
    } catch (err: unknown) {
      console.error("get vocabulary error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Get user's flashcard progress
apiRouter.get(
  "/users/:id/flashcards",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const progressSnap = await db.collection("users")
        .doc(id)
        .collection("flashcardProgress")
        .get();

      const progress = progressSnap.docs.map((doc) => ({
        wordId: doc.id,
        ...doc.data(),
      }));

      return res.json({ progress });
    } catch (err: unknown) {
      console.error("get flashcard progress error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Text-to-speech endpoint
apiRouter.post(
  "/text-to-speech",
  async (req: Request, res: Response) => {
    try {
      const { text, language = "en-US" } = req.body || {};

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Create text-to-speech client
      const client = new TextToSpeechClient();

      // Configure the request
      const request = {
        input: { text },
        voice: {
          languageCode: language,
          ssmlGender: "NEUTRAL" as const,
        },
        audioConfig: {
          audioEncoding: "MP3" as const,
        },
      };

      // Perform the text-to-speech request
      const [response] = await client.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      if (!audioContent) {
        return res.status(500).json({ error: "Failed to generate audio" });
      }

      // Return the audio as base64
      res.setHeader("Content-Type", "application/json");
      return res.json({
        audio: audioContent.toString("base64"),
        format: "mp3",
      });
    } catch (err: unknown) {
      console.error("text-to-speech error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Update user's vocabulary sheet ID
apiRouter.post(
  "/users/:id/vocabulary-sheet",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const { vocabularySheetId } = req.body || {};

      if (!vocabularySheetId) {
        return res.status(400).json({ error: "Vocabulary sheet ID is required" });
      }

      // Validate that the sheet ID format looks correct (basic validation)
      if (!vocabularySheetId.match(/^[a-zA-Z0-9-_]+$/)) {
        return res.status(400).json({ error: "Invalid vocabulary sheet ID format" });
      }

      const now = new Date();
      await db.collection("users").doc(id).update({
        vocabularySheetId,
        updatedAt: now,
      });

      return res.json({ ok: true, vocabularySheetId });
    } catch (err: unknown) {
      console.error("update vocabulary sheet error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Update flashcard progress (rate difficulty)
apiRouter.post(
  "/users/:id/flashcards/:wordId/rate",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const wordId = req.params.wordId;
      const { difficulty } = req.body || {}; // "easy", "medium", "hard"

      if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty rating" });
      }

      const now = new Date();
      const progressRef = db.collection("users")
        .doc(id)
        .collection("flashcardProgress")
        .doc(wordId);

      // Get current progress
      const currentSnap = await progressRef.get();
      const current = currentSnap.exists ? currentSnap.data() : null;

      // Calculate next review date based on spaced repetition
      let nextReviewDays = 1; // Default for hard
      if (difficulty === "easy") {
        nextReviewDays = current ? Math.min(current.interval * 2, 365) : 7;
      } else if (difficulty === "medium") {
        nextReviewDays = current ? Math.min(current.interval * 1.5, 30) : 3;
      } else {
        nextReviewDays = 1; // Hard - review tomorrow
      }

      const nextReview = new Date(now.getTime() + nextReviewDays * 24 * 60 * 60 * 1000);

      // Update progress
      await progressRef.set({
        wordId,
        difficulty,
        interval: nextReviewDays,
        lastReviewed: now,
        nextReview,
        reviewCount: (current?.reviewCount || 0) + 1,
        updatedAt: now,
      }, { merge: true });

      return res.json({ ok: true });
    } catch (err: unknown) {
      console.error("update flashcard progress error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// List a student's appointments
apiRouter.get(
  "/users/:id/appointments",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const kind = String(
        req.query.kind || req.query.status || "upcoming"
      ); // "upcoming" | "past" | "all"
      const limit = Math.min(
        parseInt(String(req.query.limit || "20"), 10) || 20,
        100
      );

      const now = admin.firestore.Timestamp.now();
      let q = db
        .collection("users")
        .doc(id)
        .collection("appointments") as FirebaseFirestore.Query;

      if (kind === "upcoming") {
        q = q
          .where("startTimestamp", ">=", now)
          .orderBy("startTimestamp", "asc");
      } else if (kind === "past") {
        q = q
          .where("endTimestamp", "<", now)
          .orderBy("endTimestamp", "desc");
      } else {
        q = q.orderBy("startTimestamp", "asc");
      }

      const snap = await q.limit(limit).get();
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }));
      return res.json({ items: data });
    } catch (err) {
      console.error("list appointments error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

apiRouter.post(
  "/billing/create-checkout-session",
  async (req: Request, res: Response) => {
    try {
      const { email, returnTo, priceId } = req.body || {};
      console.log("Received checkout request:", { email, returnTo, priceId, timestamp: new Date().toISOString() });

      if (!email) return res.status(400).json({ error: "email required" });
      if (!priceId) return res.status(400).json({ error: "priceId required" });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        console.error("Stripe not configured");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-07-30.basil" });
      const userId = String(email).trim().toLowerCase();

      const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ?
          `https://${process.env.VERCEL_URL}` :
          "https://raystutorsite.web.app"
        );
      const success = (returnTo as string) ||
        `${base}/student/${encodeURIComponent(userId)}`;

      // Determine if this is a subscription or one-time payment
      const isSubscription = priceId && (
        priceId.includes("basic") ||
        priceId.includes("advanced") ||
        priceId.includes("premium") ||
        priceId.includes("unlimited")
      );

      console.log("Creating checkout session:", { priceId, isSubscription });

      const session = await stripe.checkout.sessions.create({
        mode: isSubscription ? "subscription" : "payment",
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${success}?purchase=success`,
        cancel_url: `${success}?purchase=cancel`,
        // So our webhook can map back to the Firestore user:
        metadata: { userId },
        // Optional: automatic_tax: { enabled: true },
      });

      return res.json({ url: session.url });
    } catch (e) {
      console.error("create-checkout-session error", e);
      return res.status(500).json({ error: "internal" });
    }
  });

// Validate secret codes for free trial access
apiRouter.post(
  "/billing/validate-secret-code",
  async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body || {};
      if (!email || !code) {
        return res.status(400).json({ error: "email and code required" });
      }

      const userId = String(email).trim().toLowerCase();

      // Define valid secret codes with their durations (in days)
      const validCodes: Record<string, { duration: number; description: string }> = {
        "TRAINING2024": { duration: 30, description: "Training Access" },
      };

      const upperCode = code.toUpperCase();
      if (!validCodes[upperCode]) {
        return res.json({ valid: false, error: "Invalid code" });
      }

      // Check if code has already been used by this user
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (userData?.usedSecretCodes?.includes(upperCode)) {
        return res.json({ valid: false, error: "Code already used" });
      }

      // Activate the user's account for the specified duration
      const now = new Date();
      const codeConfig = validCodes[upperCode];
      const trialEndDate = new Date(now.getTime() + codeConfig.duration * 24 * 60 * 60 * 1000);

      await db.collection("users").doc(userId).set({
        billing: {
          active: true,
          trialCode: upperCode,
          trialEndDate: trialEndDate,
          trialDuration: codeConfig.duration,
          trialDescription: codeConfig.description,
          lastEvent: "trial.activated",
          updatedAt: now,
        },
        usedSecretCodes: admin.firestore.FieldValue.arrayUnion(upperCode),
        updatedAt: now,
      }, { merge: true });

      return res.json({
        valid: true,
        duration: codeConfig.duration,
        description: codeConfig.description,
      });
    } catch (e) {
      console.error("validate-secret-code error", e);
      return res.status(500).json({ error: "internal" });
    }
  });

// Test endpoint
apiRouter.get("/test", (_req: Request, res: Response) => {
  return res.json({ message: "API router is working" });
});

// Reset calendar sync token
apiRouter.post("/reset-calendar-sync", async (_req: Request, res: Response) => {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return res.status(500).json({ error: "GOOGLE_CALENDAR_ID not configured" });
    }

    // Delete the sync token to force a full sync
    const stateRef = db.collection("calendarSync").doc(calendarId);
    await stateRef.delete();

    return res.json({ message: "Calendar sync token reset successfully. Next sync will be a full sync." });
  } catch (error) {
    console.error("Reset calendar sync error:", error);
    return res.status(500).json({ error: "Failed to reset sync token", details: String(error) });
  }
});

// Test calendar access
apiRouter.get("/test-calendar", async (_req: Request, res: Response) => {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return res.status(500).json({ error: "GOOGLE_CALENDAR_ID not configured" });
    }

    // Auth as the function's service account
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    // List events from the last 30 days to the next 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const resp = await calendar.events.list({
      calendarId,
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      maxResults: 10,
    });

    const events = resp.data.items || [];

    return res.json({
      calendarId,
      totalEvents: events.length,
      events: events.map((ev) => ({
        id: ev.id,
        summary: ev.summary,
        start: ev.start,
        end: ev.end,
        attendees: ev.attendees?.map((a) => ({
          email: a.email,
          organizer: a.organizer,
          self: a.self,
        })) || [],
        status: ev.status,
      })),
    });
  } catch (error) {
    console.error("Calendar test error:", error);
    return res.status(500).json({ error: "Calendar access failed", details: String(error) });
  }
});

// Get Stripe price IDs for frontend
apiRouter.get(
  "/billing/price-ids",
  async (_req: Request, res: Response) => {
    try {
      console.log("Price IDs endpoint called");
      // Return the configured price IDs from Firebase config
      return res.json({
        basic: "price_1S1xoYGCvd9jQhpVhbUXWMA4",
        advanced: "price_1S1xpkGCvd9jQhpVyD5tHbvO",
        premium: "price_1S1xqMGCvd9jQhpVRoy9yfHM",
        unlimited: "price_1RyBw1GCvd9jQhpVSyp9Od3f",
        addon: "price_1S1xsRGCvd9jQhpVSQ8TNLPB",
      });
    } catch (e) {
      console.error("get price-ids error", e);
      return res.status(500).json({ error: "internal" });
    }
  });

// Get user's session count and plan info
apiRouter.get(
  "/users/:id/sessions",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const userSnap = await db.collection("users").doc(id).get();

      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userSnap.data();
      const billing = userData?.billing || {};

      // Get current month's sessions
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Count sessions this month
      const sessionsSnap = await db.collection("users")
        .doc(id)
        .collection("appointments")
        .where("startTimestamp", ">=", admin.firestore.Timestamp.fromDate(currentMonth))
        .where("startTimestamp", "<", admin.firestore.Timestamp.fromDate(nextMonth))
        .get();

      const sessionsThisMonth = sessionsSnap.docs.length;

      // Get plan limits
      const planLimits: Record<string, number> = {
        basic: 4,
        advanced: 8,
        premium: 12,
        unlimited: 30,
        trial: 999, // Unlimited for trial
      };

      const currentPlan = billing.planType || "trial";
      const monthlyLimit = planLimits[currentPlan] || 0;
      const addonSessions = billing.addonSessions || 0;
      const totalAvailable = monthlyLimit + addonSessions;
      const sessionsRemaining = Math.max(0, totalAvailable - sessionsThisMonth);

      return res.json({
        sessionsThisMonth,
        sessionsRemaining,
        monthlyLimit,
        addonSessions,
        totalAvailable,
        currentPlan,
        canSchedule: sessionsRemaining > 0,
        billing: {
          active: billing.active || false,
          planType: currentPlan,
          trialEndDate: billing.trialEndDate,
        },
      });
    } catch (err: unknown) {
      console.error("get sessions error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Mount only at '/api'
app.use("/api", apiRouter);

// 404
app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: "Not found" }));

// Export function
export const api = onRequest(
  {
    region: "us-central1",
    // allow the express handler to read Stripe secrets
    secrets: [
      S_CALENDAR_ID,
      S_VOCAB_SHEET_ID,
      defineSecret("STRIPE_SECRET_KEY"),
      defineSecret("STRIPE_PRICE_ID"),
    ],
  },
  app
);

export const syncCalendar = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Chicago",
    region: "us-central1",
    secrets: [S_CALENDAR_ID],
  },
  async () => {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || S_CALENDAR_ID.value();
    if (!calendarId) {
      console.warn("syncCalendar: GOOGLE_CALENDAR_ID missing");
      return;
    }

    // Auth as the function's service account (ADC). Make sure the calendar
    // is shared with it at least "See all event details".
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    // Where we keep delta-sync state
    const stateRef = db.collection("calendarSync").doc(calendarId);
    const stateSnap = await stateRef.get();
    const syncToken: string | undefined = stateSnap.exists ?
      (stateSnap.data()?.nextSyncToken as string | undefined) :
      undefined;

    // Helpers
    const now = new Date();

    const toISO = (dt?: { date?: string | null; dateTime?: string | null }) => {
      if (!dt) return null;
      if (dt.dateTime) return dt.dateTime;
      if (dt.date) return `${dt.date}T00:00:00Z`;
      return null;
    };

    const isUpcoming = (startISO: string | null, endISO: string | null) => {
      // Consider upcoming if it hasn't ended yet
      // (end > now) OR (no end && start >= now)
      const n = now.getTime();
      const start = startISO ? new Date(startISO).getTime() : null;
      const end = endISO ? new Date(endISO).getTime() : null;
      if (end !== null) return end > n;
      if (start !== null) return start >= n;
      return false;
    };

    const isRecent = (startISO: string | null, endISO: string | null) => {
      // Consider recent if it happened within the last 90 days
      const n = now.getTime();
      const ninetyDaysAgo = n - (90 * 24 * 60 * 60 * 1000);
      const start = startISO ? new Date(startISO).getTime() : null;
      const end = endISO ? new Date(endISO).getTime() : null;

      // If we have an end time, check if it's within the last 90 days
      if (end !== null) return end > ninetyDaysAgo;
      // If we only have a start time, check if it's within the last 90 days
      if (start !== null) return start > ninetyDaysAgo;
      return false;
    };

    // Batch helpers
    let batch = db.batch();
    let staged = 0;
    const stage = (op: () => void) => {
      op();
      staged++;
      if (staged >= 400) {
        // fire and forget inside loop; we'll await a final commit later
        batch.commit();
        batch = db.batch();
        staged = 0;
      }
    };
    const finalCommit = async () => {
      if (staged > 0) {
        await batch.commit();
        batch = db.batch();
        staged = 0;
      }
    };

    // Where we remember which student we attached a calendar event to
    const indexRef = (eventId: string) =>
      db.collection("calendarEvents").doc(eventId);

    // Convenience ops
    const upsertForStudent = (
      uid: string,
      eventId: string,
      data: Record<string, unknown>,
    ) => {
      const ref = db
        .collection("users")
        .doc(uid)
        .collection("appointments")
        .doc(eventId);
      stage(() => batch.set(ref, data, { merge: true }));
    };
    const deleteForStudent = (uid: string, eventId: string) => {
      const ref = db
        .collection("users")
        .doc(uid)
        .collection("appointments")
        .doc(eventId);
      stage(() => batch.delete(ref));
    };

    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;
    let processed = 0;

    try {
      do {
        // With syncToken you *must not* include timeMin/singleEvents/etc.
        const params: Record<string, unknown> = {
          calendarId,
          maxResults: 2500,
          pageToken,
          ...(syncToken ?
            { syncToken } :
            {
              // First run: pull **upcoming** and **recent past** events
              // (last 90 days)
              timeMin: new Date(
                now.getTime() - 90 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              singleEvents: true,
              showDeleted: true,
            }),
        };

        const resp = await calendar.events.list(params);
        const items = resp.data.items || [];
        pageToken = resp.data.nextPageToken || undefined;
        nextSyncToken = resp.data.nextSyncToken || nextSyncToken;

        console.log(`syncCalendar: found ${items.length} events in calendar`);
        console.log(`syncCalendar: now = ${now.toISOString()}, 90 days ago = ${new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()}`);
        console.log(`syncCalendar: using syncToken: ${syncToken ? "yes" : "no"}`);

        for (const ev of items) {
          processed++;
          const eventId = ev.id;
          if (!eventId) continue;

          const creatorEmail = ev.creator?.email?.toLowerCase() || null;
          const organizerEmail = ev.organizer?.email?.toLowerCase() ||
            creatorEmail || null;

          // Choose the first attendee that's not the calendar owner
          // This handles both manual bookings and appointment scheduling page bookings
          const firstStudentAttendee =
            (ev.attendees || []).find(
              (a) =>
                !!a.email &&
                !a.self &&
                a.email.toLowerCase() !== organizerEmail &&
                a.email.toLowerCase() !== creatorEmail,
            ) || null;

          console.log(`syncCalendar: event ${eventId} has ${ev.attendees?.length || 0} attendees, student attendee: ${firstStudentAttendee?.email || "none"}`);
          if (ev.attendees && ev.attendees.length > 0) {
            console.log(`syncCalendar: event ${eventId} attendee details:`, ev.attendees.map((a) => ({
              email: a.email,
              organizer: a.organizer,
              self: a.self,
              responseStatus: a.responseStatus,
            })));
          }

          // For cancellations, we must clean up anything we previously wrote
          if (ev.status === "cancelled") {
            const idxSnap = await indexRef(eventId).get();
            const studentId: string | undefined = idxSnap.exists ?
              idxSnap.data()?.studentId : undefined;
            if (studentId) {
              deleteForStudent(studentId, eventId);
              stage(() =>
                batch.set(
                  indexRef(eventId),
                  {
                    calendarId,
                    eventId,
                    status: "cancelled",
                    studentId,
                    updated: ev.updated || new Date().toISOString(),
                  },
                  { merge: true },
                ),
              );
            }
            continue;
          }

          const startISO = toISO(ev.start);
          const endISO = toISO(ev.end);

          console.log(`syncCalendar: event ${eventId} - start: ${startISO}, end: ${endISO}, isUpcoming: ${isUpcoming(startISO, endISO)}, isRecent: ${isRecent(startISO, endISO)}`);

          // Keep **upcoming** events and **recent past** events (last 90 days)
          if (!isUpcoming(startISO, endISO) && !isRecent(startISO, endISO)) {
            // If we had previously indexed this event for a student, remove it
            const idxSnap = await indexRef(eventId).get();
            const prevStudent: string | undefined = idxSnap.exists ?
              idxSnap.data()?.studentId : undefined;
            if (prevStudent) {
              deleteForStudent(prevStudent, eventId);
              // Optional: clear index to avoid future work
              stage(() => batch.delete(indexRef(eventId)));
            }
            continue;
          }

          // If we can't identify a student attendee, skip (and clean any prior
          // attach)
          if (!firstStudentAttendee?.email) {
            const idxSnap = await indexRef(eventId).get();
            const prevStudent: string | undefined = idxSnap.exists ?
              idxSnap.data()?.studentId : undefined;
            if (prevStudent) {
              deleteForStudent(prevStudent, eventId);
              stage(() => batch.delete(indexRef(eventId)));
            }
            continue;
          }

          const candidateId = firstStudentAttendee.email.toLowerCase();

          // Only keep events when the candidate attendee is an existing
          // user
          const userSnap = await db.collection("users").doc(candidateId).get();
          if (!userSnap.exists) {
            console.log(`syncCalendar: candidate attendee ${candidateId} is not a registered user`);
            // If we had previously attached to somebody, detach
            const idxSnap = await indexRef(eventId).get();
            const prevStudent: string | undefined = idxSnap.exists ?
              idxSnap.data()?.studentId : undefined;
            if (prevStudent) {
              deleteForStudent(prevStudent, eventId);
              stage(() => batch.delete(indexRef(eventId)));
            }
            continue;
          }

          // If the event was previously attached to a *different* student,
          // move it
          const idxSnap = await indexRef(eventId).get();
          const prevStudent: string | undefined = idxSnap.exists ?
            idxSnap.data()?.studentId : undefined;
          if (prevStudent && prevStudent !== candidateId) {
            deleteForStudent(prevStudent, eventId);
          }

          const startDate = startISO ? new Date(startISO) : null;
          const endDate = endISO ? new Date(endISO) : null;
          const isAllDay = !!(ev.start && ev.start.date && !ev.start.dateTime);
          const meetLink =
            ev.hangoutLink ||
            ev.conferenceData?.entryPoints?.find(
              (p) => p.entryPointType === "video",
            )?.uri ||
            null;

          console.log(`syncCalendar: creating appointment for student ${candidateId}, event ${eventId}`);

          // Upsert only under the matched student's collection
          upsertForStudent(candidateId, eventId, {
            calendarId,
            calendarEventId: eventId,
            title: ev.summary || null,
            description: ev.description || null,
            start: ev.start || null,
            end: ev.end || null,
            startTime: startISO,
            endTime: endISO,
            startTimestamp: startDate ?
              admin.firestore.Timestamp.fromDate(startDate) : null,
            endTimestamp: endDate ?
              admin.firestore.Timestamp.fromDate(endDate) : null,
            isAllDay,
            location: ev.location || null,
            meetLink,
            htmlLink: ev.htmlLink || null,
            studentId: candidateId,
            creator: creatorEmail,
            organizer: organizerEmail,
            status: ev.status,
            updated: ev.updated || new Date().toISOString(),
            cancelled: false,
            updatedAt: new Date(),
            createdAt: new Date(),
          });

          // Maintain a minimal index (only for matched events) so we can
          // remove on cancel
          stage(() =>
            batch.set(
              indexRef(eventId),
              {
                calendarId,
                eventId,
                studentId: candidateId,
                startTime: startISO,
                endTime: endISO,
                status: ev.status,
                updated: ev.updated || new Date().toISOString(),
              },
              { merge: true },
            ),
          );
        }

        await finalCommit();
      } while (pageToken);

      // Save nextSyncToken for cheap deltas next run
      if (nextSyncToken) {
        await stateRef.set(
          { nextSyncToken, updatedAt: new Date() },
          { merge: true },
        );
      }

      console.log(
        "syncCalendar: processed " +
        processed +
        " events (upcoming + recent past " +
        "+ student-matched only)"
      );
    } catch (err: unknown) {
      // If the token is stale, clear it to force a fresh (upcoming-only) sync
      // next run
      const error = err as {
        code?: number;
        response?: {
          status?: number;
          data?: {
            error?: {
              errors?: Array<{ reason?: string }>;
            };
          };
        };
        errors?: Array<{ reason?: string }>;
      };
      const code = error?.code || error?.response?.status;
      const reason = error?.errors?.[0]?.reason ||
        error?.response?.data?.error?.errors?.[0]?.reason;
      if (code === 410 || reason === "fullSyncRequired") {
        console.warn(
          "syncCalendar: sync token invalid; resetting for full sync next run.",
        );
        await stateRef.set(
          { nextSyncToken: null, resetAt: new Date() },
          { merge: true },
        );
        return;
      }
      console.error("syncCalendar error:", err);
      throw err;
    }
  }
);

// Stripe webhook (v2). Separate from Express JSON parser for rawBody use.
const S_STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const S_STRIPE_SECRET = defineSecret("STRIPE_SECRET_KEY");

export const stripeWebhook = onRequest(
  {
    region: "us-central1",
    secrets: [S_STRIPE_WEBHOOK_SECRET, S_STRIPE_SECRET],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signingSecret =
      process.env.STRIPE_WEBHOOK_SECRET ||
      S_STRIPE_WEBHOOK_SECRET.value();
    const apiKey =
      process.env.STRIPE_SECRET_KEY || S_STRIPE_SECRET.value();

    if (!signingSecret || !apiKey) {
      res.status(500).send("Stripe not configured");
      return;
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: "2025-07-30.basil",
    });

    let event: Stripe.Event;
    try {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        signingSecret
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error(
        "Webhook signature verification failed.",
        error?.message
      );
      res.status(400).send(`Webhook Error: ${error?.message}`);
      return;
    }

    try {
      const markActive = async (
        uid: string,
        on: boolean,
        payload: Record<string, unknown> = {}
      ) => {
        await db.collection("users").doc(uid).set(
          {
            billing: {
              active: on,
              ...payload,
              updatedAt: new Date(),
            },
          },
          { merge: true }
        );
      };

      switch (event.type) {
        case "checkout.session.completed": {
          const s = event.data.object as Stripe.Checkout.Session;
          const uid =
            (s.metadata?.userId as string) ||
            (s.customer_email as string) ||
            "";
          if (!uid) break;

          const subscriptionId =
            typeof s.subscription === "string" ?
              s.subscription :
              s.subscription?.id;
          const customerId =
            typeof s.customer === "string" ?
              s.customer :
              s.customer?.id;

          // Determine plan type from line items
          const lineItems = s.line_items?.data || [];
          let planType = "trial";
          let addonSessions = 0;

          for (const item of lineItems) {
            const priceId = item.price?.id || "";
            if (priceId.includes("basic")) planType = "basic";
            else if (priceId.includes("advanced")) planType = "advanced";
            else if (priceId.includes("premium")) planType = "premium";
            else if (priceId.includes("unlimited")) planType = "unlimited";
            else if (priceId.includes("addon")) {
              addonSessions += item.quantity || 1;
            }
          }

          await markActive(uid.toLowerCase(), true, {
            customerId: customerId || null,
            subscriptionId: subscriptionId || null,
            planType: planType,
            addonSessions: addonSessions,
            lastEvent: "checkout.session.completed",
          });
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.created": {
          const sub = event.data.object as Stripe.Subscription;
          let uid = (sub.metadata?.userId as string) || "";
          if (!uid) {
            const customer = (await stripe.customers.retrieve(
              sub.customer as string
            )) as Stripe.Customer;
            uid = (customer.email || "").toLowerCase();
          }
          if (!uid) break;

          const isActive =
            sub.status === "active" || sub.status === "trialing";

          const withCpe = sub as Stripe.Subscription & {
            current_period_end?: number;
          };
          const cpeUnix = withCpe.current_period_end;
          const cpe = cpeUnix ? new Date(cpeUnix * 1000) : null;

          await markActive(uid, isActive, {
            customerId: sub.customer,
            subscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: cpe,
            lastEvent: event.type,
          });
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          let uid = (sub.metadata?.userId as string) || "";
          if (!uid) {
            const customer = (await stripe.customers.retrieve(
              sub.customer as string
            )) as Stripe.Customer;
            uid = (customer.email || "").toLowerCase();
          }
          if (!uid) break;

          await markActive(uid, false, {
            customerId: sub.customer,
            subscriptionId: sub.id,
            status: sub.status,
            lastEvent: "customer.subscription.deleted",
          });
          break;
        }

        default:
          // ignore other events
          break;
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("stripeWebhook handler error", err);
      res.status(500).send("internal");
    }
  }
);

