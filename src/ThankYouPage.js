import React, { useState, useEffect } from "react";
import "./global.css";
import { useParams, useNavigate } from "react-router-dom";
import logo from "./KMALogo.png";
import { getDatabase, ref, get } from "firebase/database";
import sendEmail from "./utils/SendEmail";

const BCC_KMA_EMAILS = "pradeeppadmanabhan81@gmail.com";

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
      <tr><td>Payment ID</td><td>${latestPayment.paymentID || "N/A"}</td></tr>
    `;

    const memberTableRows = isRenewal
      ? `
        <tr><td>Member ID</td><td>${userData.id}</td></tr>
        <tr><td>Member Name</td><td>${userData.memberName}</td></tr>
        `
      : `
        <tr><td>Member ID</td><td>${userData.id}</td></tr>
        <tr><td>Member Name</td><td>${userData.memberName}</td></tr>
        
        <tr><td>Age</td><td>${userData.age}</td></tr>
        <tr><td>Date of Birth</td><td>${new Date(userData.dob).toLocaleDateString()}</td></tr>
        <tr><td>Gender</td><td>${userData.gender}</td></tr>
        <tr><td>Father/Guardian Name</td><td>${userData.fatherGuardianName}</td></tr>
        <tr><td>Address</td><td>${userData.addressLine1}, ${userData.addressLine2}, ${userData.addressLine3}</td></tr>        
        <tr><td>Mobile</td><td>${userData.mobile}</td></tr>
        <tr><td>Email</td><td>${userData.email}</td></tr>
        <tr><td>Qualifications</td><td>${userData.qualifications}</td></tr>
        <tr><td>Profession</td><td>${userData.profession}</td></tr>
        <tr><td>Athletic Background</td><td>${userData.athleticBackground}</td></tr>
        <tr><td>Trekking Experience</td><td>${userData.trekkingExperience}</td></tr>
        <tr><td>Hobbies</td><td>${userData.hobbies}</td></tr>
        <tr><td>Illness History</td><td>${userData.illnessHistory}</td></tr>
        <tr><td>Present Health</td><td>${userData.generalHealth}</td></tr>
        <tr><td>Blood Group</td><td>${userData.bloodGroup}</td></tr>
        <tr><td>Emergency Contact Name</td><td>${userData.emergencyContactName}</td></tr>
        <tr><td>Emergency Contact Number</td><td>${userData.emergencyContactPhone}</td></tr>
        <tr><td>Emergency Contact Relationship</td><td>${userData.emergencyContactRelationship}</td></tr>
        <tr><td>Emergency Contact Email</td><td>${userData.emergencyContactEmail}</td></tr>
        <tr><td>Mountaineering Certifications</td><td>${userData.mountaineeringCertifications}</td></tr>

        <tr><td>Recommended By</td><td>${userData.recommendedByName}</td></tr>

        <tr><td>Membership Type</td><td>${userData.currentMembershipType}</td></tr>        
        
        <tr><td>Renewal Due On</td><td>${new Date(userData.renewalDueOn).toLocaleDateString()}</td></tr>
        <tr><td>Date of Submission</td><td>${new Date(userData.dateOfSubmission).toLocaleDateString()}</td></tr>
        
        `;

    const emailBody = `
      <p>Dear ${userData.memberName},</p>
      <br />
      <p>${isRenewal ? "Membership Renewal" : "New Membership"} Details:</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Description</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${isRenewal ? paymentTableRows : memberTableRows + paymentTableRows}
        </tbody>
      </table>
      <p>We look forward to having you as part of The Karnataka Mountaineering Association.</p>
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
