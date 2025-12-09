// src/components/PaymentDetails.js
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import "../global.css";
import {
  fetchMemberData,
  handleRazorpayPayment,
  handleCashPayment,
} from "../utils/PaymentUtils";
import {
  ANNUAL_MEMBERSHIP_FEE,
  LIFE_MEMBERSHIP_FEE,
} from "../utils/PaymentUtils";
import { toast, ToastContainer } from "react-toastify";

const PaymentDetails = () => {
  // Access data passed from MembershipApplicationForm
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const memberID = searchParams.get("memberID");
  const membershipType = searchParams.get("membershipType");
  const paymentMode = searchParams.get("paymentMode") || "razorpay";

  const [memberData, setMemberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const paymentAmount =
    membershipType === "Annual" ? ANNUAL_MEMBERSHIP_FEE : LIFE_MEMBERSHIP_FEE;

  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (memberID) {
      fetchMemberData(memberID)
        .then(setMemberData)
        .catch(() => setStatusMessage("Error fetching member data."))
        .finally(() => setIsLoading(false));
    }
  }, [memberID]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSubmitting]);

  if (isLoading) {
    return <p>Loading member data...</p>;
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

  const handleRazorpay = async () => {
    setIsSubmitting(true);
    setStatusMessage("Processing payment...");
    toast.info(
      "Processing payment... Please do not refresh, navigate away or close the window.",
      { autoClose: false }
    );
    try {
      const paymentResult = await handleRazorpayPayment(
        memberID,
        paymentAmount,
        membershipType,
        navigate,
        setStatusMessage
      );
      console.log("Payment Result:", paymentResult);
      setStatusMessage(paymentResult.message);
    } catch (error) {
      console.error("Payment Error:", error);
      setStatusMessage("Error processing payment. Please try again.");
    } finally {
      toast.dismiss();
      setIsSubmitting(false);
    }

    setIsSubmitting(false);
  };

  return (
    <div>
      <h2>Payment Details</h2>
      <p>
        Member ID: <b>{memberID}</b>
      </p>
      <p>Membership Type: {membershipType}</p>
      <p>
        <strong>Rs. {paymentAmount}</strong> Membership Fee
      </p>
      <p>
        {" "}
        <strong>
          {" "}
          Please do NOT refresh, navigate away or close the window. <br />
          Wait for the payment to finish and get your receipt by email.{" "}
        </strong>
      </p>

      {paymentMode === "razorpay" ? (
        <button
          onClick={() => {
            handleRazorpay();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Pay with Razorpay"}
        </button>
      ) : paymentMode === "cash" ? (
        <button
          onClick={() => {
            setIsSubmitting(true);
            handleCashPayment(
              memberID,
              paymentAmount,
              "Treasurer Receipt",
              navigate
            );
          }}
          disabled={isSubmitting}
        >
          Submit Cash Payment
        </button>
      ) : (
        <p>Invalid payment mode specified.</p>
      )}

      {statusMessage && (
        <p>
          <strong>{statusMessage}</strong>
        </p>
      )}
      <ToastContainer />
    </div>
  );
};

PaymentDetails.propTypes = {
  memberID: PropTypes.string,
  membershipType: PropTypes.string,
};

export default PaymentDetails;
