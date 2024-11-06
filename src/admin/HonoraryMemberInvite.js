// src/admin/components/HonoraryMemberInvite.js
import React, { useState, useEffect } from "react";
import sendEmail from "../utils/SendEmail";

const HonoraryMemberInvite = () => {
  const [name, setName] = useState(""); // State for the name input
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timeoutId;
    if (message) {
      // Only set timeout if message is not empty
      timeoutId = setTimeout(() => {
        setMessage("");
      }, 10000); // 10 seconds timeout
    }

    // Clear timeout if the component unmounts or message changes
    return () => clearTimeout(timeoutId);
  }, [message]); // Run effect whenever 'message' changes

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Construct the invitation link
      const invitationLink = `https://membertool.vercel.app/new-application?initialMembershipType=Honorary`; // Replace with your actual app URL

      // 2. Prepare email content
      const subjectLine = "Invitation to Join KMA as an Honorary Member";
      const emailMessage = `Dear ${name},

We are pleased to invite you to join the Karnataka Mountaineering Association (KMA) as an Honorary Member.

This prestigious membership is extended to individuals who have made significant contributions to mountaineering, adventure sports, or related fields.

As an Honorary Member, you will enjoy various benefits, including:

* Recognition as a distinguished member of the KMA community
* Lifetime access to KMA events and activities
* Exemption from all fees
* ... And a host of other benefits

To accept this invitation and complete your membership application, please click on the following link:

${invitationLink}

We believe that your presence as an Honorary Member will greatly enrich our association.

Sincerely,
The KMA Team`;

      // 3. Prepare email data
      const emailData = {
        to_name: name, // Use the entered name
        to_email: email,
        subject: subjectLine,
        message: emailMessage,
      };

      // 4. Send the email
      const success = await sendEmail(emailData);

      if (success) {
        setMessage("Invitation sent successfully!");
        setName(""); // Clear the name input field
        setEmail(""); // Clear the email input field
      } else {
        setMessage("Failed to send invitation. Please try again.");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      setMessage("An error occurred. Please try again later.");
    }
  };

  return (
    <div>
      <h2>Invite Honorary Member</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label> {/* Input for the name */}
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Invitation</button>
      </form>
      {message && (
        <div
          className={`message-container ${
            message.includes("Error") ? "error" : "success"
          }`}
        >
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default HonoraryMemberInvite;
