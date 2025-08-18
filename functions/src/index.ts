import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";

setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();
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

// Health
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// Helpers
const normalizeEmail = (e: string) => e.trim().toLowerCase();
const tsNow = () => admin.firestore.Timestamp.now();

// POST /api/hooks/form-submission
app.post("/hooks/form-submission", async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as {
      submittedAt?: string;
      sheetName?: string;
      answers?: Record<string, unknown>;
      name?: string;
      email?: string;
    };

    // Prefer explicit top-level fields; fall back to answers + optional env titles
    let { name, email } = body;
    const answers = body.answers || {};

    if (!name || !email) {
      const NAME_Q = process.env.NAME_QUESTION_TITLE;
      const EMAIL_Q = process.env.EMAIL_QUESTION_TITLE;
      if (!name && NAME_Q && answers && NAME_Q in answers)
        name = String(answers[NAME_Q as keyof typeof answers]);
      if (!email && EMAIL_Q && answers && EMAIL_Q in answers)
        email = String(answers[EMAIL_Q as keyof typeof answers]);
    }

    const receivedAt = tsNow();
    const submittedAt = body.submittedAt
      ? admin.firestore.Timestamp.fromDate(new Date(body.submittedAt))
      : receivedAt;

    // Write submission
    const submission = {
      name: name ?? null,
      email: email ?? null,
      sheetName: body.sheetName ?? null,
      answers,
      submittedAt,
      receivedAt,
      source: "google-form",
    };

    const subRef = await db.collection("formSubmissions").add(submission);

    // Upsert user (if we have an email)
    if (email) {
      const userId = normalizeEmail(email);
      const userRef = db.collection("users").doc(userId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        if (snap.exists) {
          tx.update(userRef, {
            name: name ?? admin.firestore.FieldValue.delete(),
            email: userId,
            lastSubmissionAt: receivedAt,
            submissionCount: admin.firestore.FieldValue.increment(1),
            lastSubmissionRef: subRef,
          });
        } else {
          tx.set(userRef, {
            name: name ?? null,
            email: userId,
            createdAt: receivedAt,
            lastSubmissionAt: receivedAt,
            submissionCount: 1,
            lastSubmissionRef: subRef,
          });
        }
      });
    }

    return res.status(200).json({ ok: true, submissionId: subRef.id });
  } catch (err) {
    console.error("form-submission error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// 404 for unknown API paths
app.use((_req: Request, res: Response) => res.status(404).json({ error: "Not found" }));

// Export the single HTTPS function (Express)
export const api = onRequest({ region: "us-central1" }, app);

// (unchanged) Stripe stub — optional
export const stripeWebhook = functions.https.onRequest((_req, res) => {
  console.log("Stripe webhook hit");
  res.status(200).send("ok");
});
