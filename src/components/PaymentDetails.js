// src/components/PaymentDetails.js
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import { ref, get, update, runTransaction } from "firebase/database";
import { database } from "../firebase";
import "../global.css";

const PaymentDetails = () => {
  // Access data passed from MembershipApplicationForm
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const memberID = searchParams.get("memberID");
  const membershipType = searchParams.get("membershipType");
  const paymentMode = searchParams.get("paymentMode") || "Payment Gateway";

  const [memberData, setMemberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const ANNUAL_MEMBERSHIP_FEE = 250;
  const LIFE_MEMBERSHIP_FEE = 2000;

  const [paymentData, setPaymentData] = useState({
    paymentMode: paymentMode,
    receiptNumber: "",
    amount:
      membershipType === "Annual"
        ? ANNUAL_MEMBERSHIP_FEE
        : membershipType === "Life"
          ? LIFE_MEMBERSHIP_FEE
          : 0,
  });
  const [loadingError, setLoadingError] = useState(null);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch data when the component mounts
    const fetchMemberData = async () => {
      try {
        /* console.log(
          "Fetching member data for ",
          memberID,
          membershipType,
          paymentMode
        ); */
        const memberRef = ref(database, `users/${memberID}`);
        const snapshot = await get(memberRef);
        if (snapshot.exists()) {
          const memberData = snapshot.val();
          //console.log("Fetched member data:", memberData);
          setMemberData(memberData);
          //console.log("Member data fetched successfully:", snapshot.val());
          setPayments(memberData.payments || []);
        } else {
          // Handle case where member data is not found
          console.error("Member data not found for ID:", memberID);
          // Consider setting an error state or redirecting
          setLoadingError("Error: Member data not found");
        }
      } catch (error) {
        console.error("Error fetching member data:", error);
        // Handle error appropriately
        setLoadingError("Error fetching member data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (memberID) {
      // Only fetch if memberID is available
      fetchMemberData();
    } else {
      setLoadingError("Invalid URL: Missing Member ID or Membership Type");
      setIsLoading(false);
    }
  }, [memberID /*  membershipType, paymentMode */]); // Run the effect whenever memberID changes

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (isLoading) {
    return <p>Loading member data...</p>;
  }

  if (loadingError) {
    return <p className="error">{loadingError}</p>;
  }

  //console.log("memberId:", memberID, "membershipType:", membershipType);
  //console.log("paymentMode:", paymentMode);

  if (!memberID || !membershipType) {
    return (
      <div>
        Error: Invalid URL. Please provide valid member ID and membership type.
      </div>
    );
  }
  if (!memberData) {
    //Conditional rendering before fetching data
    return (
      <p> Please wait while we get the information to make your payment </p>
    );
  }

  async function generateReceiptNumber(database) {
    const receiptCounterRef = ref(database, "counters/receipt_counter");

    let receiptNumber = "";
    try {
      const result = await runTransaction(receiptCounterRef, (currentCount) => {
        if (currentCount === null) {
          currentCount = 1;
        }
        if (typeof currentCount !== "number") {
          currentCount = parseInt(currentCount, 10);
        }
        const nextCount = currentCount + 1;
        return nextCount;
      });

      if (result.committed) {
        receiptNumber = "D" + String(result.snapshot.val()).padStart(5, "0");
        //console.log("Receipt Number Generated:", receiptNumber);
      } else {
        console.error("Transaction not committed", result.error);
        throw result.error;
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
    return receiptNumber;
  }

  const handleRazorpayPayment = async () => {
    //console.log("payment amount:", paymentData.amount);

    //console.log("Creating Razorpay Order at ", new Date().toLocaleString());

    try {
      // Step 1: Fetch Razorpay Order ID from backend
      const response = await fetch(
        "https://us-central1-membertool-test.cloudfunctions.net/createRazorpayOrder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: paymentData.amount * 100, // Convert to paise
            currency: "INR",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create Razorpay order");
      }

      const order = await response.json();
      console.log("Razorpay Order created:", order);

      const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

      // Step 2: Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID, // Replace with your Razorpay Key ID
        amount: order.amount,
        currency: order.currency,
        name: "Membership Payment",
        description: `Payment for ${membershipType} Membership`,
        order_id: order.id,
        handler: async (response) => {
          console.log("Razorpay payment successful:", response);

          let receiptNumber = await generateReceiptNumber(database);

          // Step 3: Save payment details to Firebase
          const paymentRecord = {
            paymentMode: "Razorpay",
            paymentID: response.razorpay_payment_id,
            orderID: response.razorpay_order_id,
            amount: paymentData.amount,
            receiptNumber: receiptNumber,
            dateOfPayment: new Date().toISOString(),
            applicationStatus: "Paid",
            membershipType,
          };

          setPaymentData((prevData) => ({
            ...prevData,
            receiptNumber: receiptNumber,
          }));

          //console.log("Storing Razorpay payment :", paymentData);

          // Save payment details to Firebase

          try {
            // const memberRef = ref(database, `users/${memberID}`);
            const paymentRef = ref(database, `users/${memberID}/payments/`);
            const updatedPayments = [...payments, paymentRecord];
            await update(
              paymentRef,
              updatedPayments.reduce((acc, item, index) => {
                acc[index] = item;
                return acc;
              }, {})
            );
            setPayments(updatedPayments);
            console.log("Payment saved successfully");
            setStatusMessage("Payment successful!");
          } catch (error) {
            console.error("Error saving payment:", error);
          }
        },
        prefill: {
          email: "user@example.com", // Replace with user email if available
          contact: "1234567890", // Replace with user phone number if available
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error during payment:", error);
      setStatusMessage("Payment failed. Please try again.");
    }
  };

  const handleCashPayment = async (receiptNumber) => {
    try {
      const paymentRecord = {
        paymentMode: "Cash",
        amount: paymentData.amount,
        receiptNumber: receiptNumber,
        dateOfPayment: new Date().toISOString(),
        applicationStatus: "Paid",
        membershipType: membershipType,
      };

      setPaymentData((prevData) => ({
        ...prevData,
        receiptNumber: receiptNumber,
      }));

      //console.log("Storing Cash payment :", paymentRecord);

      // Save payment details to Firebase

      const paymentRef = ref(database, `users/${memberID}/payments/`);
      const updatedPayments = [...payments, paymentRecord];
      await update(
        paymentRef,
        updatedPayments.reduce((acc, item, index) => {
          acc[index] = item;
          return acc;
        }, {})
      );
      setPayments(updatedPayments);
    } catch (error) {
      console.error("Error saving payment:", error);
      setStatusMessage("Error saving payment details. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { paymentMode, receiptNumber } = paymentData;

    /* console.log(
      "handleSubmit called with payment data: ",
      paymentMode,
      receiptNumber
    ); */

    if (paymentMode === "Cash" && !receiptNumber) {
      setErrors((prev) => ({
        ...prev,
        receiptNumber: "Enter receipt number from treasurer",
      }));
      console.error("Can't record cash payment without receipt No!");
      setIsSubmitting(false);
      return;
    }

    // Update payment details in Firebase
    try {
      const updatedMemberData = { ...memberData };
      if (membershipType === "Life") {
        updatedMemberData.renewalDueOn = "N/A";
        updatedMemberData.currentMembershipType = "Life";
      } else if (membershipType === "Annual") {
        const now = new Date();
        const nextYear = new Date(memberData.renewalDueOn || now.toISOString());
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        updatedMemberData.renewalDueOn = nextYear.toISOString();
        updatedMemberData.currentMembershipType = "Annual";
      }

      updatedMemberData.applicationStatus = "Paid";
      const memberRef = ref(database, `users/${memberID}`);
      await update(memberRef, updatedMemberData);

      console.log("Updated Member Data", updatedMemberData);
      setMemberData(updatedMemberData);
      //console.log("New Payment Details:", paymentRecord);
      //console.log("Updated Payments:", updatedPayments);

      setStatusMessage("Payment details submitted successfully!");
      navigate(`/thank-you/${receiptNumber}/${memberID}`, {
        state: { memberData: updatedMemberData },
      });
    } catch (error) {
      console.error("Error updating payment details:", error);
      setStatusMessage("Error submitting payment details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Payment Details</h2>

      <p>
        Member ID: <b>{memberID}</b>
      </p>
      <p>Membership Type: {membershipType}</p>
      <p>
        Please Pay: <strong>Rs.{paymentData.amount}</strong> Membership Fee
        <br />+ Convenience Fees & Taxes
      </p>
      <label>
        Payment Mode: <p> {paymentData.paymentMode}</p>
      </label>

      <br />

      {paymentData.paymentMode === "Cash" && (
        <>
          <p> Please pay cash to the treasurer and get a receipt. </p>
        </>
      )}

      {/* Conditionally render transaction reference input */}
      {paymentData.paymentMode === "Cash" && (
        <div>
          <label htmlFor="receiptNumber">Receipt Number:</label>
          <input
            type="text"
            id="receiptNumber"
            name="receiptNumber"
            value={paymentData.receiptNumber || ""}
            placeholder="Enter receipt number from treasurer"
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                receiptNumber: e.target.value,
              })
            }
          />
          {errors.transactionReference && (
            <span className="error">{errors.transactionReference}</span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleRazorpayPayment}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Pay with Razorpay"}
      </button>
      <br />
      <br />
      {paymentData.paymentMode === "Cash" && (
        <button
          type="button"
          onClick={() => handleCashPayment(paymentData.receiptNumber)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Submit Cash Payment"}
        </button>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Payment Details"}
      </button>
      <br />
      <br />
      {statusMessage && (
        <p>
          <strong>{statusMessage}</strong>
        </p>
      )}
      <br />
    </form>
  );
};

PaymentDetails.propTypes = {
  memberID: PropTypes.string,
  membershipType: PropTypes.string,
};

export default PaymentDetails;
