/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.database();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://kmaindia.org",
      "https://*.vercel.app",
    ],
  })
);

exports.generateMemberId = functions.https.onCall(async (data, context) => {
  if (!data.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User Authentication required"
    );
  }

  const { currentMembershipType } = data.data;
  if (!currentMembershipType) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Membership type is required"
    );
  }

  const prefix =
    currentMembershipType === "Life"
      ? "LM"
      : currentMembershipType === "Honorary"
        ? "HM"
        : "AM";
  const currentYear = new Date().getFullYear();

  const result = await db
    .ref(`counters/${prefix}`)
    .transaction((currentValue) => {
      return !currentValue || currentValue.year !== currentYear
        ? { value: 1, year: currentYear }
        : { value: currentValue.value + 1, year: currentYear };
    });

  if (!result.committed) {
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update the counter"
    );
  }

  const memberId = `${prefix}${currentYear}${String(result.snapshot.val().value).padStart(3, "0")}`;
  return { memberId };
});
