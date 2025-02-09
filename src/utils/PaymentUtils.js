// src/utils/PaymentUtils.js
import { ref, get, update, runTransaction } from "firebase/database";
import { database } from "../firebase";
import { auth } from "../AuthContext";

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

/** Handles Razorpay payment and navigates upon success */
export const handleRazorpayPayment = async (
  memberID,
  amount,
  membershipType,
  navigate
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

    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const idToken = await user.getIdToken();
    const response = await fetch(
      "https://us-central1-membertool-test.cloudfunctions.net/api/createRazorpayOrder",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ amount: amount * 100, currency: "INR" }),
      }
    );

    if (!response.ok) throw new Error("Failed to create Razorpay order");
    const order = await response.json();

    // ✅ Ensure Razorpay script is loaded before creating the instance
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Membership Payment",
      description: `Payment for ${membershipType} Membership`,
      order_id: order.id,
      handler: async (response) => {
        console.log("Razorpay payment successful:", response);
        const receiptNumber = await generateReceiptNumber();
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
        const updatedPayments = [...(memberData.payments || []), paymentRecord];
        // ✅ Convert array to an object before updating Firebase
        const paymentsObject = updatedPayments.reduce((acc, item, index) => {
          acc[index] = item;
          return acc;
        }, {});
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

        // Navigate to thank-you page -
        navigate(`/thank-you/${receiptNumber}/${memberID}`);
      },
      prefill: { email: user.email },
      theme: { color: "#3399cc" },
    };

    new window.Razorpay(options).open();
  } catch (error) {
    console.error("Error during payment:", error);
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

    console.log("Cash payment recorded successfully");

    // Navigate to thank-you page
    navigate(`/thank-you/${receiptNumber}/${memberID}`);
  } catch (error) {
    console.error("Error saving cash payment:", error);
  }
};
