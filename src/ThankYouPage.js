import React from "react";
import "./ThankYouPage.css";
import { useParams } from "react-router-dom";
import logo from "./KMALogo.png"; // Import your logo
/* import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import sendEmail from "./utils/SendEmail";
import generatePDFReceipt from "./utils/generatePDFReceipt";*/

const ThankYouPage = () => {
  const { receiptNumber, memberID } = useParams();
  /* const location = useLocation();
  const { memberData } = location.state || {}; */

  /* useEffect(() => {
    const sendEmailNotification = async () => {
      if (memberData) {
        try {
          const mailSubject = `KMA Membership Payment Received - ${memberData.memberName} (ID: ${memberID}, Receipt: ${receiptNumber})`;
          const mailBody = generateEmailBody(memberData, receiptNumber);
          await sendEmail(
            "pradeeppadmanabhan81@gmail.com",
            mailSubject,
            mailBody
          );
          alert("Email sent successfully!");
        } catch (error) {
          console.error("Error sending email:", error);
          alert("Error sending email. Please try again later.");
        }
      }
    };

    sendEmailNotification();
  }, [memberData, receiptNumber, memberID]); */

  /* const handleDownloadReceipt = async () => {
    try {
      if (!memberData) {
        console.error("User data not available to generate PDF.");
        return;
      }

      const pdfBytes = await generatePDFReceipt(memberData, receiptNumber);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `KMA_Receipt_${receiptNumber}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error generating or downloading PDF:", error);
    }
  }; */

  // Helper function to generate the email body in HTML table format
  /* const generateEmailBody = (userData, receiptNumber) => {
    let tableRows = "";
    for (const key in userData) {
      tableRows += `<tr><td>${key}</td><td>${userData[key]}</td></tr>`;
    }

    return `
  <p>A member payment has been received with the following details:</p>
  <table>
    <thead><tr><th>Field</th><th>Value</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <p>Receipt Number: ${receiptNumber}</p>
`;
  }; */

  return (
    <div className="thank-you-page">
      <div className="content">
        <img
          src={logo}
          alt="KMA Logo"
          className="logo-image"
          style={{
            // Inline styles for print layout
            "@media print": {
              height: "25px",
              marginRight: "10px",
            },
          }}
        />
        <h1>Thank You!</h1>
        <p>Your application & payment have been successfully recorded.</p>
        <p>Your Provisional Member ID is: {memberID}</p>
        <p>Your receipt number: {receiptNumber} </p>
        <p>
          We will review your submission and get back to you shortly via email.
          We look forward to having you as part of the Karnataka Mountaineering
          Association.
        </p>
        {/* <button onClick={handleDownloadReceipt}>Download Receipt</button> */}
      </div>
    </div>
  );
};

export default ThankYouPage;
