// src/utils/PaymentUtils.js
import { ref, get, update, runTransaction } from "firebase/database";
import { database } from "../firebase";
import { auth } from "../AuthContext";
import { prepareEmailData } from "./EmailUtils";
import sendEmail from "./SendEmail";

export const ANNUAL_MEMBERSHIP_FEE = 250;
export const LIFE_MEMBERSHIP_FEE = 2000;

/** Fetch member data */
export const fetchMemberData = async (memberID) => {
  try {
    const memberRef = ref(database, `users/${memberID}`);
    const snapshot = await get(memberRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error fetching member data:", error);
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
    return result.committed
      ? "D" + String(result.snapshot.val()).padStart(5, "0")
      : null;
  } catch (error) {
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
  navigate,
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
          try {
            const receiptNumber = await generateReceiptNumberWithRetry();
            //console.log("Receipt Number:", receiptNumber);

            if (!response.razorpay_payment_id || !response.razorpay_order_id) {
              console.error("Invalid Razorpay response:", response);
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

            const paymentRef = ref(database, `users/${memberID}/payments/`);
            const memberRef = ref(database, `users/${memberID}`);
            const memberData = await fetchMemberData(memberID);
            //console.log("Memberdata:", memberData);
            //console.log("PaymentRecord:", paymentRecord);
            mobileNumber = memberData.mobile;
            const updatedPayments = [
              ...(memberData.payments || []),
              paymentRecord,
            ];

            if (!updatedPayments || typeof updatedPayments !== "object") {
              console.error("Invalid payment data:", updatedPayments);
              throw new Error("Invalid payment data");
            }
            //console.log("Updated Payments:", updatedPayments);

            // ✅ Convert array to an object before updating Firebase
            const paymentsObject = updatedPayments.reduce(
              (acc, item, index) => {
                acc[index] = item;
                return acc;
              },
              {}
            );
            //console.log("PaymentsObject:", paymentsObject);
            // ✅ Update
            await update(paymentRef, paymentsObject);

            //console.log("Payment saved successfully", paymentsObject);

            // ✅ Extend renewal or upgrade membership
            const updatedMemberData = { ...memberData };

            if (membershipType === "Life") {
              updatedMemberData.renewalDueOn = null;
              updatedMemberData.currentMembershipType = "Life";
            } else if (membershipType === "Annual") {
              const now = new Date();
              const nextYear = memberData.renewalDueOn
                ? new Date(memberData.renewalDueOn)
                : now;
              nextYear.setFullYear(nextYear.getFullYear() + 1);
              updatedMemberData.renewalDueOn = nextYear.toISOString();
              updatedMemberData.currentMembershipType = "Annual";
            }

            updatedMemberData.applicationStatus = "Paid";

            await update(memberRef, {
              renewalDueOn: updatedMemberData.renewalDueOn,
              currentMembershipType: updatedMemberData.currentMembershipType,
              applicationStatus: updatedMemberData.applicationStatus,
            });

            //console.log("Updated Member Data", updatedMemberData);

            // ✅ Re-fetch the updated member data
            const refreshedMemberData = await fetchMemberData(memberID);
            //console.log("Refetched Member Data:", refreshedMemberData);

            // Send payment confirmation email
            const isRenewal = (refreshedMemberData.payments || []).length > 1;
            const emailData = prepareEmailData(
              refreshedMemberData,
              receiptNumber,
              isRenewal
            );

            const emailResponse = await sendEmail(emailData);
            if (!emailResponse) {
              console.error("Failed to send payment email");
            }
            // Navigate to thank-you page -
            try {
              navigate(`/thank-you/${receiptNumber}/${memberID}`);
              resolve({
                success: true,
                message: "Thankyou, Payment successful!",
              });
            } catch (error) {
              console.error("Navigation error:", error);
            }
          } catch (error) {
            console.error("Error during payment processing:", error);
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
            reject({
              success: false,
              message: "Payment Unsuccessful!, Please try again.",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      //console.log("Razorpay instance opened:", razorpay);
    });
    return paymentPromise;
  } catch (error) {
    console.error("Error during payment:", error);
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
