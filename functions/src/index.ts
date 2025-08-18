import {setGlobalOptions} from "firebase-functions";
import * as functions from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, {Request, Response} from "express";
import cors from "cors";

setGlobalOptions({maxInstances: 10});

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
      const {name, email, sheetName, answers} = req.body || {};
      if (!email) {
        return res.status(400).json({error: "Missing email in payload"});
      }
      const userId = String(email).trim().toLowerCase();

      // Extract goals from answers if available
      const goals = answers && answers["Your Language Goals"] ?
        answers["Your Language Goals"] :
        null;

      const now = new Date();
      await db.collection("users").doc(userId).set(
        {
          name: name || null,
          email: userId,
          sheetName: sheetName || null,
          goals: goals,
          updatedAt: now,
          createdAt: now,
        },
        {merge: true}
      );

      return res.status(200).json({ok: true, userId});
    } catch (err: unknown) {
      console.error("form-submission error", err);
      return res.status(500).json({error: "internal"});
    }
  });

// Store assessment responses
apiRouter.post(
  "/hooks/assessment-submission",
  async (req: Request, res: Response) => {
    try {
      const {email, submittedAt, answers} = req.body || {};
      if (!email) {
        return res.status(400).json({error: "Missing email in payload"});
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

      return res.status(200).json({ok: true, assessmentId, userId});
    } catch (err: unknown) {
      console.error("assessment-submission error", err);
      return res.status(500).json({error: "internal"});
    }
  });

// Read user (for Student page)
apiRouter.get(
  "/users/:id",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      const snap = await db.collection("users").doc(id).get();
      if (!snap.exists) return res.status(404).json({error: "not found"});
      return res.json({id, ...snap.data()});
    } catch (err: unknown) {
      console.error("get user error", err);
      return res.status(500).json({error: "internal"});
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

      return res.json({assessments});
    } catch (err: unknown) {
      console.error("get assessments error", err);
      return res.status(500).json({error: "internal"});
    }
  });

// Mount only at '/api'
app.use("/api", apiRouter);

// 404
app.use((_req: Request, res: Response) =>
  res.status(404).json({error: "Not found"}));

// Export function
export const api = onRequest({region: "us-central1"}, app);

// (optional) legacy stub you had:
export const stripeWebhook = functions.https.onRequest((_req, res) => {
  res.status(200).send("ok");
});
