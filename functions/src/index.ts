/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
// import {onRequest} from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import express, {Request, Response} from "express";
import cors from "cors";
import {onRequest} from "firebase-functions/v2/https";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// --- Express App for API ---
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

// Example health check
app.get("/health", (req: Request, res: Response) => {
  res.json({status: "ok", env: process.env.NODE_ENV});
});

// Stub: Form submission hook
app.post("/hooks/form-submission", (req: Request, res: Response) => {
  console.log("Form submission received:", req.body);
  res.status(200).json({message: "stubbed form submission received"});
});

// Catch-all for unknown API paths
app.use((_req: Request, res: Response) =>
  res.status(404).json({error: "Not found"}));

// Export a single HTTPS Function that mounts the Express app
export const api = onRequest({region: "us-central1"}, app);

// --- Stripe Webhook Stub ---
export const stripeWebhook = functions.https.onRequest((req, res) => {
  console.log("Stripe webhook hit");
  res.status(200).send("ok"); // Always return 200 for now
});
