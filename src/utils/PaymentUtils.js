// src/utils/PaymentUtils.js
import { ref, get, update, runTransaction } from "firebase/database";
import { database } from "../firebase";
import { auth } from "../AuthContext";
import { logToCloud } from "./CloudLogUtils";

export const ANNUAL_MEMBERSHIP_FEE = 250;
export const LIFE_MEMBERSHIP_FEE = 2000;

/** Fetch member data */
export const fetchMemberData = async (memberID) => {
  try {
    const memberRef = ref(database, `users/${memberID}`);
    const snapshot = await get(memberRef);
    //console.log("Fetched member data for ID:", memberID, snapshot.val());
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error fetching member data:", error);
    logToCloud(
      "Error fetching member data for ID: " +
        memberID +
        " Error: " +
        error.message
    );
    throw error;
  }
};

/** Generate receipt number */
export const generateReceiptNumber = async () => {
  const receiptCounterRef = ref(database, "counters/receipt_counter");
  try {
    const result = await runTransaction(receiptCounterRef, (currentCount) =>
      currentCount === null ? 1 : currentCount + 1
    );
    logToCloud(
      "Generated Receipt Number: " +
        result.snapshot.val() +
        " Committed: " +
        result.committed
    );
    return result.committed
      ? "D" + String(result.snapshot.val()).padStart(5, "0")
      : null;
  } catch (error) {
    logToCloud("Error generating receipt number: " + error.message);
    console.error("Transaction failed:", error);
    throw error;
  }
};

/** Fetch payment history */
export const fetchPaymentHistory = async (memberID, depth = 5) => {
  try {
    const memberData = await fetchMemberData(memberID);
    return memberData?.payments
      ? memberData.payments.slice(-Math.min(depth, memberData.payments.length))
      : [];
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error;
  }
};

const generateReceiptNumberWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateReceiptNumber();
    } catch (error) {
      logToCloud(
        "Receipt generation failed, retrying... Attempt:",
        i + 1,
        "Error:",
        error
      );
      console.error("Receipt generation failed, retrying...", error);
      if (i === retries - 1) throw error;
    }
  }
};

/** Handles Razorpay payment and navigates upon success */
export const handleRazorpayPayment = async (
  memberID,
  amount,
  membershipType,
  onError
) => {
  try {
    /* console.log(
      "Creating Razorpay Order for",
      memberID,
      "Amount:",
      amount,
      "Membership Type:",
      membershipType
    ); */

    logToCloud(
      "Initiating Razorpay payment: MemberID: " +
        memberID +
        " amount:" +
        amount +
        " Membership Type:" +
        membershipType
    );

    let mobileNumber;
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const API_BASE = process.env.REACT_APP_API_BASE;
    //console.log("Payment Utils API_BASE: ", API_BASE);
    const idToken = await user.getIdToken();
    const response = await fetch(`${API_BASE}/api/createRazorpayOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ amount: amount * 100, currency: "INR" }),
    });

    //console.log("Razorpay response:", response);

    if (!response.ok) {
      console.error(
        `Failed to create Razorpay order. Status: ${response.status}`
      );
      logToCloud("Failed to create Razorpay order. Status: " + response.status);
      if (onError)
        onError(`Failed to create Razorpay order. Status: ${response.status}`);
      throw new Error(
        `Failed to create Razorpay order. Status: ${response.status} `
      );
    }

    const order = await response.json();

    try {
      // ✅ Ensure Razorpay script is loaded before creating the instance
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () =>
            reject(new Error("Failed to load Razorpay script"));
        });
        //console.log("Razorpay script loaded successfully");
      }
    } catch (error) {
      console.error("Error loading Razorpay script:", error);
      logToCloud("Error loading Razorpay script: " + error.message);
    }

    const paymentPromise = await new Promise((resolve, reject) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Membership Payment",
        description: `Payment for ${membershipType} Membership`,
        order_id: order.id,
        handler: async (response) => {
          //console.log("Razorpay payment response:", response);
          logToCloud("Razorpay payment response: " + JSON.stringify(response));
          try {
            const receiptNumber = await generateReceiptNumberWithRetry();
            //console.log("Receipt Number:", receiptNumber);
            logToCloud("Receipt Number: " + receiptNumber);

            if (!response.razorpay_payment_id || !response.razorpay_order_id) {
              console.error("Invalid Razorpay response:", response);
              logToCloud(
                "Invalid Razorpay response: " + JSON.stringify(response)
              );
              throw new Error("Invalid Razorpay response");
            }

            const paymentRecord = {
              paymentMode: "Razorpay",
              paymentID: response.razorpay_payment_id,
              orderID: response.razorpay_order_id,
              amount,
              receiptNumber,
              membershipType,
              dateOfPayment: new Date().toISOString(),
              applicationStatus: "Paid",
            };

            logToCloud(
              "Payment Record to be saved: " + JSON.stringify(paymentRecord)
            );

            resolve({
              success: true,
              paymentRecord,
              receiptNumber,
              message: "Payment successful!",
            });
          } catch (error) {
            console.error("Error during payment processing:", error);
            logToCloud(
              "Error during payment processing: " + JSON.stringify(error)
            );

            reject({
              success: false,
              message: "Error during payment processing!, Please try again.",
            });
          }
        },
        prefill: { email: user.email, contact: mobileNumber },
        theme: { color: "#3399cc" },
        modal: {
          escape: true,
          ondismiss: () => {
            console.error("Payment Unsuccessful!, Please try again.");
            // if (onError) onError("Payment Unsuccessful!, Please try again.");
            logToCloud(
              "Razorpay Payment Unsuccessful!, Please try again. " +
                JSON.stringify({ memberID, membershipType })
            );
            reject({
              success: false,
              message: "Payment Unsuccessful!, Please try again.",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });
    return paymentPromise;
  } catch (error) {
    console.error("Error during payment:", error);
    logToCloud("Error during payment: " + JSON.stringify(error));
    if (onError) onError(error.message);
    // Return failure response
    return {
      success: false,
      message: error.message || "An unexpected error occurred during payment.",
    };
  }
};

/** Handles cash payment and navigates upon success */
export const handleCashPayment = async (
  memberID,
  amount,
  membershipType,
  receiptNumber,
  navigate
) => {
  try {
    const paymentRecord = {
      paymentMode: "Cash",
      amount,
      receiptNumber,
      membershipType,
      dateOfPayment: new Date().toISOString(),
      applicationStatus: "Paid",
    };

    const paymentRef = ref(database, `users/${memberID}/payments/`);
    const memberData = await fetchMemberData(memberID);
    const updatedPayments = [...(memberData.payments || []), paymentRecord];

    // ✅ Convert array to object before updating Firebase
    const paymentsObject = updatedPayments.reduce((acc, item, index) => {
      acc[index] = item;
      return acc;
    }, {});

    await update(paymentRef, paymentsObject);

    //console.log("Cash payment recorded successfully");

    // Navigate to thank-you page
    navigate(`/thank-you/${receiptNumber}/${memberID}`);
  } catch (error) {
    console.error("Error saving cash payment:", error);
  }
};

export const updatePaymentRecord = async (memberID, paymentRecord) => {
  try {
    /* console.log(
      "Updating payment record for memberID:",
      memberID + " with record: ",
      paymentRecord
    ); */
    const memberRef = ref(database, `users/${memberID}`);
    const snapshot = await get(memberRef);

    if (!snapshot.exists()) {
      logToCloud("Member data not found for ID: " + memberID);
      throw new Error(`Member data not found for ID: ${memberID}`);
    }

    const memberData = snapshot.val();
    const updatedPayments = [...(memberData.payments || []), paymentRecord];

    // Convert array to object for Firebase
    const paymentsObject = updatedPayments.reduce((acc, item, index) => {
      acc[index] = item;
      return acc;
    }, {});
    //console.log("Payments Object:", paymentsObject);

    // Update the payments in Firebase
    const paymentRef = ref(database, `users/${memberID}/payments`);
    await update(paymentRef, paymentsObject);

    //console.log("Payment record updated successfully:", paymentRecord);
    logToCloud(
      "Payment record updated successfully: " + JSON.stringify(paymentRecord)
    );
    return true;
  } catch (error) {
    console.error("Error updating payment record:", error);
    throw error;
  }
};
