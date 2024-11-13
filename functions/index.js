/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

/* const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger"); */

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.generateMemberId = functions.https.onCall(async (data, context) => {
  try {
    const membershipType = data.membershipType;

    const membershipTypePrefix =
      membershipType === "Life"
        ? "LM"
        : membershipType === "Honorary"
          ? "HM"
          : "AM";

    const currentYear = new Date().getFullYear();

    // Atomically get the next ID for the specific membership type
    const newId = await admin
      .database()
      .ref(`counters/${membershipTypePrefix}`)
      .transaction((currentValue) => {
        if (currentValue === null || currentValue.year !== currentYear) {
          // Reset counter if it's a new year or doesn't exist
          return { value: 1, year: currentYear };
        } else {
          // Increment the counter for the existing year
          return { value: currentValue.value + 1, year: currentYear };
        }
      })
      .then((result) => {
        const nextId = result.snapshot.val().value; // Access the 'value' from the object
        return `${membershipTypePrefix}${currentYear}${nextId
          .toString()
          .padStart(3, "0")}`;
      });

    return { memberId: newId };
  } catch (error) {
    console.error("Error generating member ID:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error generating member ID"
    );
  }
});
