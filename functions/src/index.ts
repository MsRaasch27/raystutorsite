/* eslint-disable
  @typescript-eslint/no-misused-promises,
  object-curly-spacing,
  indent,
  operator-linebreak
*/
import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import {google} from "googleapis";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import express, {Request, Response} from "express";
import cors from "cors";

setGlobalOptions({maxInstances: 10});
const S_CALENDAR_ID = defineSecret("GOOGLE_CALENDAR_ID");

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
      return res.json({items: data});
    } catch (err) {
      console.error("list appointments error", err);
      return res.status(500).json({error: "internal"});
    }
  });

apiRouter.post(
  "/billing/create-checkout-session",
  async (req: Request, res: Response) => {
    try {
      const {email, returnTo} = req.body || {};
      if (!email) return res.status(400).json({error: "email required"});

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const priceId = process.env.STRIPE_PRICE_ID;
      if (!stripeKey || !priceId) {
        console.error("Stripe not configured");
        return res.status(500).json({error: "Stripe not configured"});
      }

      const stripe = new Stripe(stripeKey, {apiVersion: "2025-07-30.basil"});
      const userId = String(email).trim().toLowerCase();

      const base =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ?
          `https://${process.env.VERCEL_URL}` :
          "https://raystutorsite.web.app"
        );
      const success = (returnTo as string) ||
        `${base}/student/${encodeURIComponent(userId)}`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: email,
        line_items: [{price: priceId, quantity: 1}],
        success_url: `${success}?purchase=success`,
        cancel_url: `${success}?purchase=cancel`,
        // So our webhook can map back to the Firestore user:
        metadata: {userId},
        // Optional: automatic_tax: { enabled: true },
      });

      return res.json({url: session.url});
    } catch (e) {
      console.error("create-checkout-session error", e);
      return res.status(500).json({error: "internal"});
    }
  });

// Mount only at '/api'
app.use("/api", apiRouter);

// 404
app.use((_req: Request, res: Response) =>
  res.status(404).json({error: "Not found"}));

// Export function
export const api = onRequest(
  {
    region: "us-central1",
    // allow the express handler to read Stripe secrets
    secrets: [
      S_CALENDAR_ID,
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
    const calendar = google.calendar({version: "v3", auth});

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
      stage(() => batch.set(ref, data, {merge: true}));
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
            {syncToken} :
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

        for (const ev of items) {
          processed++;
          const eventId = ev.id;
          if (!eventId) continue;

          const creatorEmail = ev.creator?.email?.toLowerCase() || null;
          const organizerEmail = ev.organizer?.email?.toLowerCase() ||
            creatorEmail || null;

          // Choose the first attendee that's not organizer/creator/self
          const firstStudentAttendee =
            (ev.attendees || []).find(
              (a) =>
                !!a.email &&
                !a.organizer &&
                !a.self &&
                a.email.toLowerCase() !== organizerEmail &&
                a.email.toLowerCase() !== creatorEmail,
            ) || null;

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
                  {merge: true},
                ),
              );
            }
            continue;
          }

          const startISO = toISO(ev.start);
          const endISO = toISO(ev.end);

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
              {merge: true},
            ),
          );
        }

        await finalCommit();
      } while (pageToken);

      // Save nextSyncToken for cheap deltas next run
      if (nextSyncToken) {
        await stateRef.set(
          {nextSyncToken, updatedAt: new Date()},
          {merge: true},
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
          {nextSyncToken: null, resetAt: new Date()},
          {merge: true},
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
          {merge: true}
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

        await markActive(uid.toLowerCase(), true, {
          customerId: customerId || null,
          subscriptionId: subscriptionId || null,
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

