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
        .finally(() => setIsLoading(false));
    }
  }, [memberID]);

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

      {paymentMode === "razorpay" ? (
        <button
          onClick={() => {
            setIsSubmitting(true);
            handleRazorpayPayment(
              memberID,
              paymentAmount,
              membershipType,
              navigate,
              setStatusMessage
            );
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
    </div>
  );
};

PaymentDetails.propTypes = {
  memberID: PropTypes.string,
  membershipType: PropTypes.string,
};

export default PaymentDetails;
