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

const Razorpay = require("razorpay");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// console.log("ENV:", process.env.NODE_ENV);
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const REACT_APP_DATABASE_URL = process.env.REACT_APP_DATABASE_URL;

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: REACT_APP_DATABASE_URL,
});
const db = admin.database();

const app = express();
app.use(express.json());

//Dynamic CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000", // local development
      "http://192.168.1.28:3000", //local development on network
      "https://kmaindia.org", // production domain
    ];

    //Allow wildcard subdomains for vercel.app
    const isVercelOrigin = origin && origin.endsWith(".vercel.app");

    if (allowedOrigins.includes(origin) || isVercelOrigin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
  headers: {
    "X-Razorpay-Account": "your-account-id",
  },
});

razorpay.log = console.log;

exports.createRazorpayOrder = functions.https.onRequest(async (req, res) => {
  cors(corsOptions)(req, res, async () => {
    /* console.log(
      "Process details",
      process.env.RAZORPAY_KEY_ID,
      process.env.RAZORPAY_KEY_SECRET
    );
    console.log(
      "Process Lengths:",
      process.env.RAZORPAY_KEY_ID.length,
      process.env.RAZORPAY_KEY_SECRET.length
    );
    console.log(
      "Razorpay object details",
      razorpay.key_id,
      razorpay.key_secret
    );
    console.log("req.body: ", req.body); */

    try {
      const { amount, currency } = req.body;
      console.log("Creating order:", amount, currency);

      if (!amount || !currency) {
        return res
          .status(400)
          .json({ error: "Amount and Currency are required" });
      }

      const options = {
        amount: amount,
        currency: currency || "INR",
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);
      console.log("Order created:", order);
      res.status(200).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).send("error creating order: " + error.message);
    }
  });
});

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
