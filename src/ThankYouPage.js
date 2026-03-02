import React, { useState, useEffect } from "react";
import "./global.css";
import { useParams, useNavigate } from "react-router-dom";
import logo from "./KMALogo.png";
import { getDatabase, ref, get } from "firebase/database";
import { logToCloud } from "./utils/CloudLogUtils";
import {
  LIFE_MEMBERSHIP_FEE,
  ANNUAL_MEMBERSHIP_FEE,
} from "./utils/PaymentUtils";

const ThankYouPage = () => {
  const { receiptNumber, memberID } = useParams();
  //const [emailStatus, setEmailStatus] = useState("");
  const [isRenewal, setIsRenewal] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [lifeMemberID, setLifeMemberID] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        logToCloud("ThankYouPage: Fetching member data for ID: " + memberID);
        const database = getDatabase();
        const memberRef = ref(database, `users/${memberID}`);
        const snapshot = await get(memberRef);
        if (snapshot.exists()) {
          const data = snapshot.val();

          const lastPayment = (data.payments || []).slice(-1)[0];
          const paymentAmount = lastPayment ? lastPayment.amount : 0;
          //console.log("Payment Amount:", paymentAmount);
          logToCloud(
            "Last payment amount for ID " + memberID + ": " + paymentAmount
          );
          //console.log("Data: ", data);

          if (paymentAmount === LIFE_MEMBERSHIP_FEE) {
            setIsUpgrade(true);
            setLifeMemberID(data.lifeMemberID);
            //console.log("Life Member ID:", data.lifeMemberID);
            logToCloud(
              "Membership upgrade detected for ID: " +
                memberID +
                " Life Member ID: " +
                data.lifeMemberID
            );
          } else if (paymentAmount === ANNUAL_MEMBERSHIP_FEE) {
            if (data.payments.length > 1) {
              setIsRenewal(true);
              logToCloud("Renewal detected for ID: " + memberID);
            } else {
              setIsRenewal(false);
              logToCloud("New annual membership detected for ID: " + memberID);
            }
          } else {
            console.error("Unknown payment amount:", paymentAmount);
            logToCloud("Unknown payment amount: " + paymentAmount);
          }
        } else {
          console.error("Member data not found for ID:", memberID);
          logToCloud("Member data not found for ID: " + memberID);
        }
      } catch (error) {
        console.error("Error fetching member data:", error);
        logToCloud(
          "Error fetching member data for ID: " + memberID + " Error: " + error
        );
        //setEmailStatus("Error sending email, please try again later", error);
      } finally {
      }
    };
    fetchMemberData();
  }, [memberID, receiptNumber]);

  return (
    <div className="thank-you-page">
      <div className="content">
        <img src={logo} alt="KMA Logo" className="logo-image" />
        <h1>Thank You!</h1>
        <p>
          {isRenewal
            ? "Your payment has been successfully recorded. Your membership ID remains active."
            : isUpgrade
              ? "Your payment has been successfully recorded. Your membership is upgraded to Life Membership."
              : "Your application and payment have been successfully recorded. Your Provisional Member ID is provided below."}
        </p>
        <p>
          <strong>Membership ID:</strong>{" "}
          {isRenewal
            ? memberID
            : isUpgrade
              ? lifeMemberID
              : `${memberID} (Provisional)`}
        </p>
        <p>
          <strong>Receipt Number:</strong> {receiptNumber}
        </p>
        <p>
          {isRenewal
            ? "We appreciate your continued support as a valued member."
            : isUpgrade
              ? "Congratulations on becoming a Life Member of The Karnataka Mountaineering Association!"
              : "We will review your submission and get back to you shortly via email. Welcome to The Karnataka Mountaineering Association!"}
        </p>
        {/* <p>
          <strong>{emailStatus}</strong>
        </p> */}

        {/* ✅ Button to navigate back to Profile Page */}
        <button
          className="back-to-profile-button"
          onClick={() => navigate(`/profile?memberID=${memberID}`)}
        >
          My Profile
        </button>
      </div>
    </div>
  );
};

export default ThankYouPage;
