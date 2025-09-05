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
const S_TEMPLATE_SHEET_ID = defineSecret("GOOGLE_TEMPLATE_SHEET_ID");
const S_OAUTH_CLIENT_ID = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const S_OAUTH_CLIENT_SECRET = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");
const S_OAUTH_REDIRECT_URI = defineSecret("GOOGLE_OAUTH_REDIRECT_URI");

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

// ----- Google OAuth helper -----
/**
 * Creates and returns a Google OAuth2 client with configured credentials
 * @return {google.auth.OAuth2} The configured OAuth2 client
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || S_OAUTH_CLIENT_ID.value();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || S_OAUTH_CLIENT_SECRET.value();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || S_OAUTH_REDIRECT_URI.value();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Gets a valid OAuth2 client with refreshed tokens if needed
 * @return {Promise<any | null>} The configured OAuth2 client or null if no valid tokens
 */
async function getValidOAuth2Client(): Promise<any | null> {
  try {
    const oauthDoc = await db.collection("integrations").doc("google_oauth").get();
    if (!oauthDoc.exists) {
      return null;
    }

    const tokens = (oauthDoc.data() as any)?.tokens;
    if (!tokens) {
      return null;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Check if tokens are expired and refresh if needed
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      console.log("OAuth tokens expired, attempting to refresh...");
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update stored tokens
        await db.collection("integrations").doc("google_oauth").set({
          tokens: credentials,
          updatedAt: new Date(),
        }, { merge: true });

        oauth2Client.setCredentials(credentials);
        console.log("OAuth tokens refreshed successfully");
      } catch (refreshError) {
        console.error("Failed to refresh OAuth tokens:", refreshError);
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    console.error("Error getting valid OAuth2 client:", error);
    return null;
  }
}

/**
 * Fetches the user's Google profile picture URL
 * @param {string} email - The user's email address
 * @return {Promise<string | null>} The profile picture URL or null if not available
 */
async function fetchGoogleProfilePicture(email: string): Promise<string | null> {
  try {
    const oauth2Client = await getValidOAuth2Client();
    if (!oauth2Client) {
      console.log("No valid OAuth client available for fetching profile picture");
      return null;
    }

    // Use Google People API to get user profile
    const people = google.people({ version: "v1", auth: oauth2Client });

    // First, get the user's profile
    const profileResponse = await people.people.get({
      resourceName: "people/me",
      personFields: "photos",
    });

    const photos = profileResponse.data.photos;
    if (photos && photos.length > 0) {
      // Get the profile picture (usually the first photo)
      const profilePhoto = photos.find((photo) => photo.metadata?.primary) || photos[0];
      if (profilePhoto?.url) {
        console.log(`Fetched Google profile picture for ${email}: ${profilePhoto.url}`);
        return profilePhoto.url;
      }
    }

    console.log(`No profile picture found for ${email}`);
    return null;
  } catch (error) {
    console.error(`Error fetching Google profile picture for ${email}:`, error);
    return null;
  }
}

/**
 * Mapping of assessment answer options to CEFR levels
 * This maps the actual answer text that students see to the corresponding CEFR level
 */
const ANSWER_TO_CEFR_MAPPING: Record<string, string> = {
  // Understanding/Listening options
  "I can understand very basic words and instructions": "A1",
  "I can understand short, clear messages about everyday things": "A2",
  "I can understand the main points in conversations about familiar topics": "B1",
  "I can understand detailed information on many topics, including work or school": "B2",
  "I can understand long and complex spoken English, even when not clearly structured": "C1",
  "I can easily understand any spoken English, including idioms and accents": "C2",

  // Speaking options
  "I can say simple words and phrases": "A1",
  "I can ask and answer basic questions on familiar topics": "A2",
  "I can join in conversations on everyday topics and describe experiences": "B1",
  "I can speak clearly and in detail on a wide range of subjects": "B2",
  "I can use language flexibly and effectively for social, academic, or professional purposes": "C1",
  "I can express myself fluently, even in complex situations": "C2",

  // Reading options
  "I can read familiar names, words, and simple sentences": "A1",
  "I can read short texts like ads, menus, and emails": "A2",
  "I can understand the main ideas in everyday texts or short stories": "B1",
  "I can read and understand articles, reports, or essays": "B2",
  "I can understand long, complex texts including opinions and arguments": "C1",
  "I can read and critically analyze any written text, even literary or technical": "C2",

  // Writing options
  "I can write simple sentences about myself or everyday topics": "A1",
  "I can write short messages, notes, or descriptions": "A2",
  "I can write simple connected texts like emails, stories, or explanations": "B1",
  "I can write clear, detailed texts on many subjects": "B2",
  "I can write well-structured essays or reports for work or school": "C1",
  "I can write in a very natural and accurate way, even on complex topics": "C2",
};

/**
 * Helper function to extract CEFR level from answer text using mapping
 * @param {string} answer - The answer text to extract CEFR level from
 * @return {string | null} The extracted CEFR level or null if not found
 */
function extractCEFRLevel(answer: string): string | null {
  if (!answer) return null;

  // First try exact match with the mapping
  const exactMatch = ANSWER_TO_CEFR_MAPPING[answer.trim()];
  if (exactMatch) {
    return exactMatch;
  }

  // Fallback: try to find CEFR level patterns in the text (for backward compatibility)
  const cefrPatterns = [
    /A1\b/i,
    /A2\b/i,
    /B1\b/i,
    /B2\b/i,
    /C1\b/i,
    /C2\b/i,
  ];

  for (const pattern of cefrPatterns) {
    const match = answer.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  return null;
}

/**
 * Helper function to map assessment questions to CEFR categories
 * @param {string} question - The question text to map to a category
 * @return {string | null} The mapped category or null if not found
 */
function mapQuestionToCategory(question: string): string | null {
  const questionLower = question.toLowerCase();

  if (questionLower.includes("understand") || questionLower.includes("listening")) {
    return "understanding";
  } else if (questionLower.includes("speak") || questionLower.includes("conversation")) {
    return "speaking";
  } else if (questionLower.includes("read") || questionLower.includes("text")) {
    return "reading";
  } else if (questionLower.includes("write") || questionLower.includes("composition")) {
    return "writing";
  }

  return null;
}

/**
 * Helper function to process assessment answers and extract CEFR levels
 * @param {Record<string, string | number | boolean>} answers - The assessment answers
 * @return {Object} Object containing CEFR levels for each category
 */
function processAssessmentAnswers(answers: Record<string, string | number | boolean>): {
  understanding?: string;
  speaking?: string;
  reading?: string;
  writing?: string;
} {
  const cefrLevels: {
    understanding?: string;
    speaking?: string;
    reading?: string;
    writing?: string;
  } = {};

  for (const [question, answer] of Object.entries(answers)) {
    const category = mapQuestionToCategory(question);
    if (category && typeof answer === "string") {
      const level = extractCEFRLevel(answer);
      if (level) {
        cefrLevels[category as keyof typeof cefrLevels] = level;
      }
    }
  }

  return cefrLevels;
}

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

// Begin Google OAuth
apiRouter.get("/auth/google/start", async (_req: Request, res: Response) => {
  try {
    const oauth2Client = getOAuth2Client();
    const scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/cloud-translation",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
    });
    res.redirect(url);
  } catch (e) {
    console.error("oauth start error", e);
    res.status(500).json({ error: "oauth_start_failed" });
  }
});

apiRouter.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query as { code?: string };
    if (!code) {
      res.status(400).json({ error: "missing_code" });
      return;
    }
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      // If no refresh token, user may have already consented; force prompt next time
      console.warn("No refresh token returned; consider removing prior consent");
    }
    // Store tokens under a well-known doc (single admin integration)
    await db.collection("integrations").doc("google_oauth").set({
      tokens,
      updatedAt: new Date(),
    }, { merge: true });
    res.send("Google Drive/Sheets connected. You can close this window.");
  } catch (e) {
    console.error("oauth callback error", e);
    res.status(500).json({ error: "oauth_callback_failed" });
  }
});
// End Google OAuth

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

      // Extract native language from answers if available
      const natLang = answers && answers["Your Native Language"] ?
      answers["Your Native Language"] :
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

      // Extract photo from answers if available, or fetch from Google profile
      let photo = answers && answers["Your Photo"] ?
        answers["Your Photo"] :
        null;

      // If no photo provided in form, try to fetch from Google profile
      if (!photo) {
        try {
          photo = await fetchGoogleProfilePicture(userId);
        } catch (photoError) {
          console.error("Error fetching Google profile picture:", photoError);
          // Continue without photo if fetch fails
        }
      }

      const now = new Date();

      // Create a copy of the template vocabulary spreadsheet for the new user
      let vocabularySheetId = null;
      try {
        // Prefer OAuth (acts as MsRaasch27) when available; fallback to service account
        let drive = null as ReturnType<typeof google.drive> | null;
        let sheets = null as ReturnType<typeof google.sheets> | null;
        let authClient: any = null;

        // Try to get valid OAuth client with token refresh
        const oauth2Client = await getValidOAuth2Client();
        if (oauth2Client) {
          authClient = oauth2Client;
          drive = google.drive({ version: "v3", auth: oauth2Client });
          sheets = google.sheets({ version: "v4", auth: oauth2Client });
        }

        if (!drive || !sheets) {
          authClient = await google.auth.getClient({
            scopes: [
              "https://www.googleapis.com/auth/spreadsheets",
              "https://www.googleapis.com/auth/drive",
              "https://www.googleapis.com/auth/cloud-translation",
              "https://www.googleapis.com/auth/userinfo.profile",
              "https://www.googleapis.com/auth/userinfo.email",
            ],
          });
          drive = google.drive({ version: "v3", auth: authClient });
          sheets = google.sheets({ version: "v4", auth: authClient });
        }

        // Template spreadsheet ID from environment variable
        let templateSheetId = S_TEMPLATE_SHEET_ID.value();

        // First, check if we can access the template
        try {
          await drive.files.get({ fileId: templateSheetId });
        } catch (templateError) {
          console.error(`Cannot access template spreadsheet ${templateSheetId}:`, templateError);

          // If template is not accessible, create a new one
          console.log("Creating new template spreadsheet...");
          const newTemplate = await sheets.spreadsheets.create({
            requestBody: {
              properties: {
                title: "Vocabulary Template - English to Native Language",
              },
              sheets: [
                {
                  properties: {
                    title: "Vocabulary",
                    gridProperties: {
                      rowCount: 100,
                      columnCount: 4,
                    },
                  },
                },
              ],
            },
          });

          if (newTemplate.data.spreadsheetId) {
            templateSheetId = newTemplate.data.spreadsheetId;

            // Add sample data to the template
            await sheets.spreadsheets.values.update({
              spreadsheetId: templateSheetId,
              range: "A1:D1",
              valueInputOption: "RAW",
              requestBody: {
                values: [["English", "Native Language", "Part of Speech", "Example"]],
              },
            });

            // Add some sample vocabulary words
            await sheets.spreadsheets.values.update({
              spreadsheetId: templateSheetId,
              range: "A2:D6",
              valueInputOption: "RAW",
              requestBody: {
                values: [
                  ["Hello", "", "interjection", "Hello, how are you?"],
                  ["Goodbye", "", "interjection", "Goodbye, see you later!"],
                  ["Thank you", "", "phrase", "Thank you for your help."],
                  ["Please", "", "adverb", "Please come in."],
                  ["Sorry", "", "adjective", "I'm sorry for the mistake."],
                ],
              },
            });

            console.log(`Created new template spreadsheet: ${templateSheetId}`);
          } else {
            throw new Error("Failed to create new template spreadsheet");
          }
        }

        // Create a copy of the template in the teacher's account (MsRaasch27@gmail.com)
        const copyResponse = await drive.files.copy({
          fileId: templateSheetId,
          requestBody: {
            name: `${name || userId}'s Vocabulary Sheet`,
            // The copy will be created in the same account as the template (MsRaasch27@gmail.com)
          },
        });

        if (copyResponse.data.id) {
          vocabularySheetId = copyResponse.data.id;

          // Update the "Native Language" column header to the user's actual native language
          if (natLang) {
            try {
              await sheets.spreadsheets.values.update({
                spreadsheetId: vocabularySheetId,
                range: "B1", // Assuming "Native Language" is in cell B1
                valueInputOption: "RAW",
                requestBody: {
                  values: [[natLang]],
                },
              });
              console.log(`Updated native language header to "${natLang}" for user ${userId}`);

              // Get the English words from column A and translate them to the user's native language
              const englishWordsResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: vocabularySheetId,
                range: "A:A", // Get all values from column A
              });

              const englishWords = englishWordsResponse.data.values || [];
              if (englishWords.length > 1) { // Skip header row
                // Map language names to language codes
                const languageCodeMap: Record<string, string> = {
                  "Spanish": "es",
                  "French": "fr",
                  "German": "de",
                  "Italian": "it",
                  "Portuguese": "pt",
                  "Russian": "ru",
                  "Japanese": "ja",
                  "Korean": "ko",
                  "Chinese": "zh",
                  "Arabic": "ar",
                  "Hindi": "hi",
                  "Thai": "th",
                  "Vietnamese": "vi",
                  "Indonesian": "id",
                  "Dutch": "nl",
                  "Swedish": "sv",
                  "Norwegian": "no",
                  "Danish": "da",
                  "Finnish": "fi",
                  "Polish": "pl",
                  "Czech": "cs",
                  "Hungarian": "hu",
                  "Turkish": "tr",
                  "Greek": "el",
                  "Hebrew": "he",
                  "Persian": "fa",
                  "Urdu": "ur",
                  "Bengali": "bn",
                  "Tamil": "ta",
                  "Telugu": "te",
                  "Marathi": "mr",
                  "Gujarati": "gu",
                  "Kannada": "kn",
                  "Malayalam": "ml",
                  "Punjabi": "pa",
                };

                const targetLanguage = languageCodeMap[natLang] || "es"; // Default to Spanish if not found
                console.log(`Using target language code: ${targetLanguage} for native language: ${natLang}`);

                // Use Google Translate API through googleapis
                const translate = google.translate({ version: "v2", auth: authClient });

                // Translate each English word/phrase
                const translations: string[][] = [];
                for (let i = 1; i < englishWords.length; i++) { // Start from index 1 to skip header
                  const englishWord = englishWords[i][0];
                  if (englishWord && englishWord.trim()) {
                    try {
                      console.log(`Attempting to translate "${englishWord}" to ${targetLanguage}...`);

                      const translationResponse = await translate.translations.translate({
                        requestBody: {
                          q: [englishWord],
                          target: targetLanguage,
                          source: "en",
                        },
                      });

                      console.log(`Translation response for "${englishWord}":`, JSON.stringify(translationResponse.data, null, 2));

                      const translation = (translationResponse.data as any).data?.translations?.[0]?.translatedText || "";
                      translations.push([translation]);
                      console.log(`Translated "${englishWord}" to "${translation}" for user ${userId}`);
                    } catch (translationError) {
                      console.error(`Error translating "${englishWord}":`, translationError);
                      console.error("Translation error details:", JSON.stringify(translationError, null, 2));
                      translations.push([""]); // Empty string if translation fails
                    }
                  } else {
                    translations.push([""]); // Empty string for empty cells
                  }
                }

                // Update column B with translations
                if (translations.length > 0) {
                  await sheets.spreadsheets.values.update({
                    spreadsheetId: vocabularySheetId,
                    range: `B2:B${translations.length + 1}`, // Start from B2 to skip header
                    valueInputOption: "RAW",
                    requestBody: {
                      values: translations,
                    },
                  });
                  console.log(`Added ${translations.length} translations to vocabulary sheet for user ${userId}`);
                }
              }
            } catch (updateError) {
              console.error("Error updating native language header:", updateError);
              // Don't fail the whole process if header update fails
            }
          }

          // Share the copied spreadsheet with the user
          await drive.permissions.create({
            fileId: vocabularySheetId,
            requestBody: {
              role: "writer",
              type: "user",
              emailAddress: userId,
            },
          });

          console.log(`Created vocabulary sheet ${vocabularySheetId} for user ${userId}`);
        }
      } catch (error) {
        console.error("Error creating vocabulary sheet:", error);

        // Log more detailed error information
        if (error && typeof error === "object" && "code" in error) {
          console.error("Error code:", error.code);
          console.error("Error details:", error);
        }

        // Don't fail the user creation if sheet creation fails
      }

      // Create a copy of the Master English Lessons Library spreadsheet for the new user (teacher use only)
      let lessonsLibrarySheetId = null;
      try {
        // Prefer OAuth (acts as MsRaasch27) when available; fallback to service account
        let drive = null as ReturnType<typeof google.drive> | null;
        let authClient: any = null;

        // Try to get valid OAuth client with token refresh
        const oauth2Client = await getValidOAuth2Client();
        if (oauth2Client) {
          authClient = oauth2Client;
          drive = google.drive({ version: "v3", auth: oauth2Client });
        }

        if (!drive) {
          authClient = await google.auth.getClient({
            scopes: [
              "https://www.googleapis.com/auth/drive",
              "https://www.googleapis.com/auth/spreadsheets",
            ],
          });
          drive = google.drive({ version: "v3", auth: authClient });
        }

        // Master English Lessons Library spreadsheet ID from environment variable
        const masterLessonsLibraryId = "1lPLZ-N09Iz2nj11sVnIicw0uThdAxmgPAA2oAAbihnc"; // Temporary hardcode for testing

        if (masterLessonsLibraryId) {
          // First, check if we can access the master lessons library
          try {
            await drive.files.get({ fileId: masterLessonsLibraryId });
          } catch (masterError) {
            console.error(`Cannot access Master English Lessons Library ${masterLessonsLibraryId}:`, masterError);
            throw new Error("Master English Lessons Library not accessible");
          }

          // Create a copy of the master lessons library in the teacher's account (MsRaasch27@gmail.com)
          const copyResponse = await drive.files.copy({
            fileId: masterLessonsLibraryId,
            requestBody: {
              name: `${name || userId} Lesson Queue`,
              // The copy will be created in the same account as the master (MsRaasch27@gmail.com)
            },
          });

          if (copyResponse.data.id) {
            lessonsLibrarySheetId = copyResponse.data.id;

            // Note: Do NOT share with the student - this is purely for teacher use
            console.log(`Created lessons library sheet ${lessonsLibrarySheetId} for user ${userId} (teacher use only)`);
          }
        } else {
          console.log("MASTER_LESSONS_TEMPLATE_ID not set, skipping lessons library creation");
        }
      } catch (error) {
        console.error("Error creating lessons library sheet:", error);

        // Log more detailed error information
        if (error && typeof error === "object" && "code" in error) {
          console.error("Error code:", error.code);
          console.error("Error details:", error);
        }

        // Don't fail the user creation if lessons library sheet creation fails
      }

      await db.collection("users").doc(userId).set(
        {
          name: name || null,
          email: userId,
          sheetName: sheetName || null,
          age: age,
          natLang: natLang,
          goals: goals,
          frequency: frequency,
          preferredtime: preferredtime,
          timezone: timezone,
          photo: photo,
          vocabularySheetId: vocabularySheetId,
          lessonsLibrarySheetId: lessonsLibrarySheetId, // For teacher reference only
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true, userId, vocabularySheetId, lessonsLibrarySheetId });
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

      // Process CEFR levels from answers
      const cefrLevels = processAssessmentAnswers(answers || {});
      console.log("Assessment submission - processed CEFR levels:", cefrLevels);
      console.log("Assessment submission - raw answers:", answers);

      await db.collection("assessments").doc(assessmentId).set({
        userId: userId,
        email: userId,
        submittedAt: submittedAt || now.toISOString(),
        answers: answers || {},
        cefrLevels: cefrLevels,
        createdAt: now,
      });

      // Update user document with CEFR levels
      await db.collection("users").doc(userId).set({
        cefrLevels: cefrLevels,
        lastAssessmentDate: now,
        updatedAt: now,
      }, { merge: true });

      console.log("Updated user document with CEFR levels:", userId, cefrLevels);

      return res.status(200).json({ ok: true, assessmentId, userId, cefrLevels });
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
      console.log("Getting assessments for user:", id);

      const assessmentsSnap = await db.collection("assessments")
        .where("userId", "==", id)
        .orderBy("createdAt", "desc")
        .get();

      const assessments = assessmentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Found assessments for user:", id, "count:", assessments.length);
      console.log("Assessment details:", assessments);

      return res.json({ assessments });
    } catch (err: unknown) {
      console.error("get assessments error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Get user's CEFR levels
apiRouter.get(
  "/users/:id/cefr-levels",
  async (req: Request, res: Response) => {
    try {
      const id = decodeURIComponent(req.params.id).trim().toLowerCase();
      console.log("Getting CEFR levels for user:", id);

      const userSnap = await db.collection("users").doc(id).get();

      if (!userSnap.exists) {
        console.log("User not found:", id);
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userSnap.data();
      const cefrLevels = userData?.cefrLevels || {};
      const lastAssessmentDate = userData?.lastAssessmentDate;

      console.log("User data for CEFR levels:", {
        userId: id,
        cefrLevels,
        lastAssessmentDate,
        hasAssessment: !!lastAssessmentDate,
      });

      return res.json({
        cefrLevels,
        lastAssessmentDate,
        hasAssessment: !!lastAssessmentDate,
      });
    } catch (err: unknown) {
      console.error("get CEFR levels error", err);
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

      // Prefer OAuth (acts as MsRaasch27) when available; fallback to service account
      let sheets = null as ReturnType<typeof google.sheets> | null;
      let authClient = null as any;

      // Try to get valid OAuth client with token refresh
      const oauth2Client = await getValidOAuth2Client();
      if (oauth2Client) {
        authClient = oauth2Client;
        sheets = google.sheets({ version: "v4", auth: oauth2Client });
      }

      if (!sheets) {
        authClient = await google.auth.getClient({
          scopes: [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/cloud-translation",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
          ],
        });
        sheets = google.sheets({ version: "v4", auth: authClient });
      }

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

// Debug endpoint to check user data
apiRouter.get("/debug/user/:id", async (req: Request, res: Response) => {
  try {
    const id = decodeURIComponent(req.params.id).trim().toLowerCase();
    console.log("Debug: Getting user data for:", id);

    const userSnap = await db.collection("users").doc(id).get();
    const userData = userSnap.exists ? userSnap.data() : null;

    const assessmentsSnap = await db.collection("assessments")
      .where("userId", "==", id)
      .get();
    const assessments = assessmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.json({
      userId: id,
      userExists: userSnap.exists,
      userData: userData,
      assessmentCount: assessments.length,
      assessments: assessments,
    });
  } catch (err) {
    console.error("Debug user error:", err);
    return res.status(500).json({ error: "Debug failed" });
  }
});

// Fix endpoint to update user document with CEFR levels from existing assessment
apiRouter.post("/debug/fix-user-cefr/:id", async (req: Request, res: Response) => {
  try {
    const id = decodeURIComponent(req.params.id).trim().toLowerCase();
    console.log("Fix: Updating user CEFR levels for:", id);

    // Get the most recent assessment
    const assessmentsSnap = await db.collection("assessments")
      .where("userId", "==", id)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (assessmentsSnap.empty) {
      return res.status(404).json({ error: "No assessments found for user" });
    }

    const assessment = assessmentsSnap.docs[0].data();
    const cefrLevels = assessment.cefrLevels;
    const submittedAt = assessment.submittedAt;

    if (!cefrLevels) {
      return res.status(400).json({ error: "No CEFR levels found in assessment" });
    }

    console.log("Fix: Found CEFR levels:", cefrLevels);
    console.log("Fix: Assessment submitted at:", submittedAt);

    // Update user document
    const now = new Date();
    const assessmentDate = submittedAt ? new Date(submittedAt) : now;

    await db.collection("users").doc(id).set({
      cefrLevels: cefrLevels,
      lastAssessmentDate: assessmentDate,
      updatedAt: now,
    }, { merge: true });

    console.log("Fix: Successfully updated user document with CEFR levels");

    return res.json({
      success: true,
      userId: id,
      cefrLevels: cefrLevels,
      lastAssessmentDate: assessmentDate,
      message: "User document updated successfully",
    });
  } catch (err) {
    console.error("Fix user CEFR error:", err);
    return res.status(500).json({ error: "Fix failed" });
  }
});

// Test Google Translate API
apiRouter.get("/test-translate", async (_req: Request, res: Response) => {
  try {
    console.log("Testing Google Translate API...");

    // Try to get valid OAuth client
    const oauth2Client = await getValidOAuth2Client();
    let authClient: any = null;

    if (oauth2Client) {
      authClient = oauth2Client;
      console.log("Using OAuth client for translation test");
    } else {
      authClient = await google.auth.getClient({
        scopes: [
          "https://www.googleapis.com/auth/cloud-translation",
        ],
      });
      console.log("Using service account for translation test");
    }

    const translate = google.translate({ version: "v2", auth: authClient });

    console.log("Making test translation request...");
    const translationResponse = await translate.translations.translate({
      requestBody: {
        q: ["Hello"],
        target: "th",
        source: "en",
      },
    });

    console.log("Translation test response:", JSON.stringify(translationResponse.data, null, 2));

    return res.json({
      success: true,
      translation: (translationResponse.data as any).data?.translations?.[0]?.translatedText || "No translation",
      fullResponse: translationResponse.data,
    });
  } catch (error) {
    console.error("Translation test error:", error);
    return res.status(500).json({
      success: false,
      error: String(error),
      details: JSON.stringify(error, null, 2),
    });
  }
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
      scopes: ["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/calendar.events"],
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
        description: ev.description,
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

// Get all students for teacher dashboard
apiRouter.get(
  "/teacher/students",
  async (req: Request, res: Response) => {
    try {
      const studentsSnap = await db.collection("users")
        .orderBy("createdAt", "desc")
        .get();

      const students = await Promise.all(
        studentsSnap.docs.map(async (doc) => {
          const userData = doc.data();
          const userId = doc.id;

          // Get recent lessons (last 5)
          const recentLessonsSnap = await db.collection("users")
            .doc(userId)
            .collection("appointments")
            .where("endTimestamp", "<", admin.firestore.Timestamp.now())
            .orderBy("endTimestamp", "desc")
            .limit(5)
            .get();

          const recentLessons = recentLessonsSnap.docs.map((lessonDoc) => ({
            id: lessonDoc.id,
            ...lessonDoc.data(),
          }));

          // Get upcoming lessons (next 5)
          const upcomingLessonsSnap = await db.collection("users")
            .doc(userId)
            .collection("appointments")
            .where("startTimestamp", ">=", admin.firestore.Timestamp.now())
            .orderBy("startTimestamp", "asc")
            .limit(5)
            .get();

          const upcomingLessons = upcomingLessonsSnap.docs.map((lessonDoc) => ({
            id: lessonDoc.id,
            ...lessonDoc.data(),
          }));

          return {
            id: userId,
            ...userData,
            recentLessons,
            upcomingLessons,
          };
        })
      );

      return res.json({ students });
    } catch (err: unknown) {
      console.error("get students error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

// Get detailed lesson information
apiRouter.get(
  "/teacher/lessons/:lessonId",
  async (req: Request, res: Response) => {
    try {
      const lessonId = req.params.lessonId;
      console.log("Looking for lesson details with ID:", lessonId);

      // Get lesson details directly from the lessonDetails collection
      const lessonDetailsSnap = await db.collection("lessonDetails")
        .doc(lessonId)
        .get();

      if (!lessonDetailsSnap.exists) {
        console.log("Lesson details not found, creating empty record");
        // Create an empty lesson details record
        const emptyDetails = {
          topic: null,
          vocabulary: [],
          homework: null,
          learningActivity: null,
          resources: [],
          teacherNotes: null,
          calendarEventId: lessonId,
          createdAt: new Date(),
          updatedAt: new Date(),
                 };

                  await db.collection("lessonDetails").doc(lessonId).set(emptyDetails);

         return res.json({
          lesson: {
            id: lessonId,
          },
          details: emptyDetails,
        });
      }

      const lessonDetails = lessonDetailsSnap.data();
      console.log("Found lesson details:", lessonDetails);

      return res.json({
        lesson: {
          id: lessonId,
        },
        details: lessonDetails,
      });
    } catch (err: unknown) {
      console.error("get lesson details error", err);
      return res.status(500).json({ error: "internal" });
    }
  });

/**
 * Helper function to format lesson details into calendar description
 * @param {Object} details - The lesson details object
 * @param {string|null} details.topic - The lesson topic
 * @param {string[]} details.vocabulary - Array of vocabulary words
 * @param {string|null} details.homework - Homework assignment
 * @param {string[]} details.resources - Array of resource links
 * @return {string} Formatted description string for Google Calendar
 */
function formatLessonDetailsForCalendar(details: {
  topic?: string | null;
  vocabulary?: string[];
  homework?: string | null;
  resources?: string[];
}): string {
  const sections: string[] = [];

  if (details.topic) {
    sections.push(`📚 Topic: ${details.topic}`);
  }

  if (details.vocabulary && details.vocabulary.length > 0) {
    sections.push(`📝 Vocabulary:\n${details.vocabulary.map((word) => `• ${word}`).join("\n")}`);
  }

  if (details.homework) {
    sections.push(`📋 Homework: ${details.homework}`);
  }

  if (details.resources && details.resources.length > 0) {
    sections.push(`🔗 Resources:\n${details.resources.map((resource) => `• ${resource}`).join("\n")}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "";
}

// Update lesson details
apiRouter.post(
  "/teacher/lessons/:lessonId/details",
  async (req: Request, res: Response) => {
    try {
      const lessonId = req.params.lessonId;
      const { topic, vocabulary, homework, learningActivity, resources, teacherNotes } = req.body || {};

      const now = new Date();
      const lessonDetails = {
        topic: topic || null,
        vocabulary: vocabulary || [],
        homework: homework || null,
        learningActivity: learningActivity || null,
        resources: resources || [],
        teacherNotes: teacherNotes || null,
        updatedAt: now,
        createdAt: now,
      };

      // Save lesson details to Firestore
      await db.collection("lessonDetails").doc(lessonId).set(lessonDetails, { merge: true });

      // Update Google Calendar event description
      try {
        const calendarId = process.env.GOOGLE_CALENDAR_ID;
        console.log("Calendar ID:", calendarId);

        if (calendarId) {
          const auth = await google.auth.getClient({
            scopes: ["https://www.googleapis.com/auth/calendar.events"],
          });
          const calendar = google.calendar({ version: "v3", auth });

          console.log("Getting current event for lesson:", lessonId);

          // Get the current event to preserve other fields
          const currentEvent = await calendar.events.get({
            calendarId,
            eventId: lessonId,
          });

          if (currentEvent.data) {
            const description = formatLessonDetailsForCalendar(lessonDetails);
            console.log("Formatted description for calendar:", description);

            // Update the event with the new description
            const updateResult = await calendar.events.update({
              calendarId,
              eventId: lessonId,
              requestBody: {
                ...currentEvent.data,
                description: description,
              },
            });

            console.log(`Successfully updated calendar event ${lessonId} with lesson details:`, updateResult.data?.description);
          } else {
            console.log("No current event data found for lesson:", lessonId);
          }
        } else {
          console.log("No calendar ID configured");
        }
      } catch (calendarError) {
        console.error("Error updating calendar event:", calendarError);
        // Don't fail the entire request if calendar update fails
      }

      return res.json({ ok: true });
    } catch (err: unknown) {
      console.error("update lesson details error", err);
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
      S_TEMPLATE_SHEET_ID,
      S_OAUTH_CLIENT_ID,
      S_OAUTH_CLIENT_SECRET,
      S_OAUTH_REDIRECT_URI,
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
      scopes: ["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/calendar.events"],
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

          // Create lesson details record if it doesn't exist
          const lessonDetailsRef = db.collection("lessonDetails").doc(eventId);
          const lessonDetailsSnap = await lessonDetailsRef.get();
          if (!lessonDetailsSnap.exists) {
            // Create empty lesson details record
            const emptyDetails = {
              topic: null,
              vocabulary: [],
              homework: null,
              learningActivity: null,
              resources: [],
              teacherNotes: null,
              calendarEventId: eventId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await lessonDetailsRef.set(emptyDetails);

            // Update the calendar event description with empty details (will be empty initially)
            try {
              const description = formatLessonDetailsForCalendar(emptyDetails);
              console.log("Updating new calendar event with description:", description);

              const updateResult = await calendar.events.update({
                calendarId,
                eventId: eventId,
                requestBody: {
                  ...ev,
                  description: description,
                },
              });
              console.log(`Successfully updated new calendar event ${eventId} with empty lesson details structure:`, updateResult.data?.description);
            } catch (calendarUpdateError) {
              console.error("Error updating new calendar event:", calendarUpdateError);
            }
          } else {
            // Try to populate lesson details from student's lesson queue spreadsheet
            let populatedDetails = {
              topic: null,
              vocabulary: [],
              homework: null,
              learningActivity: null,
              resources: [],
              teacherNotes: null,
              studentId: candidateId,
              calendarEventId: eventId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            try {
              // Get the student's lesson queue spreadsheet ID
              const studentDoc = await db.collection("users").doc(candidateId).get();
              if (studentDoc.exists) {
                const studentData = studentDoc.data();
                const lessonsLibrarySheetId = studentData?.lessonsLibrarySheetId;

                if (lessonsLibrarySheetId) {
                  console.log(`Attempting to populate lesson details from spreadsheet ${lessonsLibrarySheetId} for student ${candidateId}`);

                  // Get Google Sheets API client
                  let sheets = null as ReturnType<typeof google.sheets> | null;
                  let authClient: any = null;

                  // Try to get valid OAuth client with token refresh
                  const oauth2Client = await getValidOAuth2Client();
                  if (oauth2Client) {
                    authClient = oauth2Client;
                    sheets = google.sheets({ version: "v4", auth: oauth2Client });
                  }

                  if (!sheets) {
                    authClient = await google.auth.getClient({
                      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
                    });
                    sheets = google.sheets({ version: "v4", auth: authClient });
                  }

                  // Read the first non-highlighted row from the lesson queue
                  const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: lessonsLibrarySheetId,
                    range: "A:F", // Assuming columns: Topic, Learning Activity, Resources, Vocabulary, Homework, Status
                  });

                  const rows = response.data.values || [];
                  if (rows.length > 1) { // Skip header row
                    // Find the first non-highlighted row (assuming status is in column F)
                    let lessonRow = null;
                    for (let i = 1; i < rows.length; i++) {
                      const row = rows[i];
                      const status = row[5] || ""; // Column F (index 5) for status
                      // Skip rows that are marked as completed, cancelled, or highlighted
                      if (!status.toLowerCase().includes("completed") &&
                          !status.toLowerCase().includes("cancelled") &&
                          !status.toLowerCase().includes("done") &&
                          !status.toLowerCase().includes("highlighted")) {
                        lessonRow = row;
                        break;
                      }
                    }

                    if (lessonRow) {
                      console.log(`Found lesson row for student ${candidateId}:`, lessonRow);

                      // Map spreadsheet columns to lesson details
                      populatedDetails = {
                        ...populatedDetails,
                        topic: lessonRow[0] || null, // Column A: Topic
                        learningActivity: lessonRow[1] || null, // Column B: Learning Activity
                        resources: lessonRow[2] ? lessonRow[2].split(",").map((r: string) => r.trim()).filter((r: string) => r) : [], // Column C: Resources (comma-separated)
                        vocabulary: lessonRow[3] ? lessonRow[3].split(",").map((v: string) => v.trim()).filter((v: string) => v) : [], // Column D: Vocabulary (comma-separated)
                        homework: lessonRow[4] || null, // Column E: Homework
                      };

                      console.log(`Populated lesson details for student ${candidateId}:`, populatedDetails);
                    } else {
                      console.log(`No available lesson rows found in spreadsheet for student ${candidateId}`);
                    }
                  }
                } else {
                  console.log(`No lesson queue spreadsheet found for student ${candidateId}`);
                }
              }
            } catch (error) {
              console.error(`Error populating lesson details from spreadsheet for student ${candidateId}:`, error);
              // Continue with empty lesson details if spreadsheet reading fails
            }

            stage(() => batch.set(lessonDetailsRef, populatedDetails));
          }

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

