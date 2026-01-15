import React, { useState, useEffect } from "react";
import "./global.css";
import { useParams, useNavigate } from "react-router-dom";
import logo from "./KMALogo.png";
import { getDatabase, ref, get } from "firebase/database";

const ThankYouPage = () => {
  const { receiptNumber, memberID } = useParams();
  const [emailStatus, setEmailStatus] = useState("");
  const [isRenewal, setIsRenewal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const database = getDatabase();
        const memberRef = ref(database, `users/${memberID}`);
        const snapshot = await get(memberRef);
        if (snapshot.exists()) {
          const data = snapshot.val();

          const renewalStatus = (data.payments || []).length > 1;
          setIsRenewal(renewalStatus);
        } else {
          console.error("Member data not found for ID:", memberID);
        }
      } catch (error) {
        console.error("Error fetching member data or sending email:", error);
        setEmailStatus("Error sending email, please try again later", error);
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
            : "Your application and payment have been successfully recorded. Your Provisional Member ID is provided below."}
        </p>
        <p>
          <strong>Membership ID:</strong>{" "}
          {isRenewal ? memberID : `${memberID} (Provisional)`}
        </p>
        <p>
          <strong>Receipt Number:</strong> {receiptNumber}
        </p>
        <p>
          {isRenewal
            ? "We appreciate your continued support as a valued member."
            : "We will review your submission and get back to you shortly via email. Welcome to the Karnataka Mountaineering Association!"}
        </p>
        <p>
          <strong>{emailStatus}</strong>
        </p>

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
