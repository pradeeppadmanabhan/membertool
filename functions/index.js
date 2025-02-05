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

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");

// console.log("ENV:", process.env.NODE_ENV);
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const REACT_APP_DATABASE_URL = process.env.REACT_APP_DATABASE_URL;

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: REACT_APP_DATABASE_URL,
  });
}

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
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.options("*", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204).send("");
});

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

//Middleware for Firebase Authentication (used in protected routes)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Unauthorized request");
      return res.status(403).json({ error: "Unauthorized request" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    console.log("Received ID Token:", idToken);

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decodedToken);

    if (!decodedToken) {
      console.log("Unauthorized");
      return res.status(403).json({ error: "Unauthorized" });
    }

    req.user = decodedToken; // Attach decoded user data to request
    console.log("Authenticated user:", req.user);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// ✅ Route: Create Razorpay Order
app.post("/createRazorpayOrder", async (req, res) => {
  try {
    const { amount, currency } = req.body;
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
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order: " + error.message);
  }
});

// ✅ Route: Generate Member ID (Protected)
app.post("/generateMemberID", authenticateUser, async (req, res) => {
  try {
    const { currentMembershipType } = req.body;
    if (!currentMembershipType) {
      return res.status(400).json({ error: "Membership type is required" });
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
      return res.status(500).json({ error: "Failed to update the counter" });
    }

    const memberId = `${prefix}${currentYear}${String(result.snapshot.val().value).padStart(3, "0")}`;

    console.log("Generated Member ID:", memberId);

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.status(200).json({ memberId });
  } catch (error) {
    console.error("Error generating Member ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Export Unified Express App as Firebase Function
exports.api = functions.https.onRequest(app);
