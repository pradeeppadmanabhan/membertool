import React, { useState, useEffect } from "react";
import "./ThankYouPage.css";
import { useParams } from "react-router-dom";
import logo from "./KMALogo.png";
import { getDatabase, ref, get } from "firebase/database";
import sendEmail from "./utils/SendEmail";

const BCC_KMA_EMAILS = "pradeeppadmanabhan81@gmail.com";

const ThankYouPage = () => {
  const { receiptNumber, memberID } = useParams();
  const [emailStatus, setEmailStatus] = useState("");
  const [isRenewal, setIsRenewal] = useState(false);

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

          const emailData = prepareEmailData(
            data,
            receiptNumber,
            renewalStatus
          );

          const success = await sendEmail(emailData);
          if (success) {
            setEmailStatus(`Email sent successfully to ${data.email}  !`);
          } else {
            setEmailStatus("Error sending email, please try again later");
          }
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

  const prepareEmailData = (userData, receiptNumber, isRenewal) => {
    const payments = userData.payments || [];
    const latestPayment = payments[payments.length - 1];
    console.log("Latest Payment:", latestPayment);

    const paymentTableRows = `
     <tr><td>Amount</td><td>₹${latestPayment.amount}</td></tr>
      <tr><td>Date of Payment</td><td>${new Date(latestPayment.dateOfPayment).toLocaleDateString()}</td></tr>
      <tr><td>Payment Mode</td><td>${latestPayment.paymentMode}</td></tr>
      <tr><td>Receipt Number</td><td>${receiptNumber}</td></tr>
      <tr><td>Transaction Reference</td><td>${latestPayment.transactionReference || "N/A"}</td></tr>
    `;

    const memberTableRows = isRenewal
      ? ""
      : `
        <tr><td>Member Name</td><td>${userData.memberName}</td></tr>
        <tr><td>Member ID</td><td>${userData.id}</td></tr>
        <tr><td>Date of Birth</td><td>${new Date(userData.dob).toLocaleDateString()}</td></tr>
        <tr><td>Gender</td><td>${userData.gender}</td></tr>
        <tr><td>Email</td><td>${userData.email}</td></tr>
        <tr><td>Mobile</td><td>${userData.mobile}</td></tr>
        <tr><td>Address</td><td>${userData.addressLine1}, ${userData.addressLine2}, ${userData.addressLine3}</td></tr>
      `;

    const emailBody = `
      <p>${isRenewal ? "Membership Renewal" : "New Membership"} Details:</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Field</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${isRenewal ? paymentTableRows : memberTableRows + paymentTableRows}
        </tbody>
      </table>
      <p>We look forward to having you as part of the Karnataka Mountaineering Association.</p>
    `;

    return {
      to_name: userData.memberName || "Member",
      to_email: userData.email,
      bcc_email: BCC_KMA_EMAILS,
      subject: isRenewal
        ? `KMA Membership Renewal - ${userData.memberName} (ID: ${userData.id})`
        : `KMA New Membership Application - ${userData.memberName} (ID: ${userData.id})`,
      message: emailBody,
      contentType: "text/html",
    };
  };

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
      </div>
    </div>
  );
};

export default ThankYouPage;
