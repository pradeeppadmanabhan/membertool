// src/admin/components/HonoraryMemberInvite.js
import React, { useState, useEffect } from "react";
import sendEmail from "../utils/SendEmail";

const MemberInvite = () => {
  const [name, setName] = useState(""); // State for the name input
  const [email, setEmail] = useState("");
  const [membershipType, setMembershipType] = useState("Annual"); // Defaulting to Annual
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState("");

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

  const validateForm = () => {
    const errors = {};
    if (!name) {
      errors.name = "Name is required";
    }
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
    }
    if (!membershipType) {
      errors.membershipType = "Membership type is required";
    }
    return errors;
  };

  const handleMembershipTypeChange = (event) => {
    setMembershipType(event.target.value);
    setErrors({ ...errors, membershipType: "" }); // Clear the error when a type is selected
    setMessage(""); // Also clear previous messages
  };

  // 1. Construct the invitation link
  const invitationLink = `https://membertool.vercel.app/new-application?initialMembershipType=${membershipType}`;

  const honoraryMemberInvite = `Dear ${name},

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

  const lifeMemberInvite = `Dear ${name},
  
  We are pleased to invite you to join the Karnataka Mountaineering Association (KMA) as a Life Member.
  
  This membership offers lifetime access to our events and activities.  As a Life Member, you will enjoy various benefits, including:
  
  * Recognition as a valued member of the KMA community
  * Lifetime access to KMA events and activities
  * Exemption from annual renewal fees
  * ... And a host of other benefits
  
  To accept this invitation and complete your membership application, please click on the following link:
  
  ${invitationLink}
    
  Sincerely,
  The KMA Team`;

  const annualMemberInvite = `Dear ${name},
  
  We are pleased to invite you to join the Karnataka Mountaineering Association (KMA) as an Annual Member.  This membership offers annual access to our events and activities. As an Annual Member, you will enjoy various benefits, including:
  
  * Recognition as a member of the KMA community
  * Annual access to KMA events and activities
  * ... And a host of other benefits
  
  To accept this invitation and complete your membership application, please click on the following link:
  
  ${invitationLink}
  
  Sincerely,
  The KMA Team`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setMessage(
        <React.Fragment>
          <b>Please fix the errors before submitting:</b>
          <br />
          {Object.values(validationErrors).map((message, index) => (
            <React.Fragment key={index}>
              {message}
              <br />
            </React.Fragment>
          ))}
        </React.Fragment>
      );
      return;
    }

    try {
      // 2. Prepare email content
      const subjectLine = `Invitation to Join KMA as an ${membershipType} Member`;
      let emailMessage;
      switch (membershipType) {
        case "Honorary":
          emailMessage = honoraryMemberInvite;
          break;
        case "Life":
          emailMessage = lifeMemberInvite;
          break;
        case "Annual":
          emailMessage = annualMemberInvite;
          break;
        default:
          emailMessage = annualMemberInvite; // Default to Annual if no match
      }

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
      <h2>Invite Member</h2>
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
        {/* Dropdown for Membership Type */}
        <div>
          <label htmlFor="membershipType">Membership Type:</label>
          <select
            id="membershipType"
            className="filter-select"
            value={membershipType}
            onChange={handleMembershipTypeChange}
          >
            <option value="Annual">Annual</option>
            <option value="Life">Life</option>
            <option value="Honorary">Honorary</option>
          </select>
        </div>
        <br />
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

export default MemberInvite;
