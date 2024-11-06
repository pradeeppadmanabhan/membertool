// src/Admin/RenewalDueList.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import "../global.css"; // Import your CSS file
import sendEmail from "../utils/SendEmail";

const RenewalDueList = () => {
  const [membersDue, setMembersDue] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null); // State to track email status
  const [sentInvites, setSentInvites] = useState([]); // Array to track sent invites

  useEffect(() => {
    const dataRef = ref(database, "users");

    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1); // Get last month's date

        const dueMembers = Object.values(data).filter((user) => {
          if (user.membershipType !== "Annual") {
            return false;
          }

          const renewalDate = new Date(user.renewalDueOn);
          // Check if renewal is due within the next month OR within the past month
          return (
            (renewalDate >= today && renewalDate < nextMonth) ||
            (renewalDate >= lastMonth && renewalDate < today)
          );
        });

        // Calculate renewal status for each member
        const membersWithStatus = dueMembers.map((user) => {
          const renewalDate = new Date(user.renewalDueOn);
          let renewalStatus = "Due"; // Default status

          if (renewalDate < today) {
            renewalStatus = "Pending"; // Within grace period (past month)
          }
          if (renewalDate < lastMonth) {
            renewalStatus = "Not Renewed"; // Beyond grace period
          }

          return { ...user, renewalStatus }; // Add renewalStatus to user object
        });

        setMembersDue(membersWithStatus);
      }
    });
  }, []);

  const handleSendReminder = async (user) => {
    try {
      const today = new Date();
      const dueDate = new Date(user.renewalDueOn);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

      let subjectLine = "";
      let message = "";

      if (daysDiff > 0) {
        subjectLine = `KMA Membership Renewal Reminder - ${daysDiff} days left`;
        message = `Dear ${user.memberName},\n\nThis is a friendly reminder that your KMA membership is due for renewal in ${daysDiff} days, on ${user.renewalDueOn}.`;
      } else if (daysDiff === 0) {
        subjectLine = `KMA Membership Renewal Due Today`;
        message = `Dear ${user.memberName},\n\nThis is a reminder that your KMA membership is due for renewal today, ${user.renewalDueOn}.`;
      } else {
        subjectLine = `KMA Membership Renewal - ${Math.abs(
          daysDiff
        )} days overdue`;
        message = `Dear ${
          user.memberName
        },\n\nThis is a reminder that your KMA membership was due for renewal ${Math.abs(
          daysDiff
        )} days ago, on ${user.renewalDueOn}.`;
      }

      // Prepare email data
      const emailData = {
        to_name: user.memberName,
        to_email: user.email,
        subject: subjectLine,
        message: message,
        // ... any other data you want to pass to the email template
      };

      const success = await sendEmail(emailData);

      if (success) {
        // Optionally show a success message to the user
        console.log("Reminder email sent successfully!");
      } else {
        // Handle email sending error, e.g., show an error message
        console.error("Failed to send reminder email.");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      // Handle error appropriately
    }
  };

  const handleElevateToLifeMember = async (user) => {
    try {
      // 1. Construct the payment link
      const paymentLink = `https://your-payment-gateway.com/checkout?userId=${user.id}&membershipType=Life`; // Replace with your actual payment gateway URL

      // 2. Prepare email content
      const subjectLine = "Invitation to Upgrade to KMA Life Membership";
      const message = `Dear ${user.memberName},

We are pleased to offer you an exclusive opportunity to upgrade your KMA membership to a Life Membership!

As a valued member, we recognize your continued support and dedication to our association. Upgrading to a Life Membership offers numerous benefits, including:

* Lifetime access to KMA events and activities
* Exemption from annual renewal fees
* ... And a host of other benefits

To upgrade your membership, simply click on the following link, which will direct you to our secure payment portal:

${paymentLink}

We encourage you to seize this opportunity and join our esteemed community of Life Members.

If you have any questions or require further assistance, please do not hesitate to contact us.

Sincerely,
The KMA Team`;

      // 3. Prepare email data
      const emailData = {
        to_name: user.memberName,
        to_email: user.email,
        subject: subjectLine,
        message: message,
      };

      // 4. Send the email
      const success = await sendEmail(emailData);

      if (success) {
        console.log("Life membership invitation email sent successfully!");
        setEmailStatus(`Invitation sent successfully to ${user.memberName}!`); // Set success message with name
        setSentInvites([...sentInvites, user.id]);
      } else {
        console.error("Failed to send life membership invitation email.");
        setEmailStatus(`Failed to send invitation to ${user.memberName}.`); // Set error message with name
      }

      // Set a timeout to clear the emailStatus after 5 seconds
      setTimeout(() => {
        setEmailStatus(null);
      }, 5000); // 5000 milliseconds = 5 seconds
    } catch (error) {
      console.error("Error sending life membership invitation:", error);
      setEmailStatus(
        `Error sending invitation to ${user.memberName}, due to ${error.message}`
      ); // Set error message with name
    }
  };

  const isApproachingSecondAnniversary = (joiningDate) => {
    const today = new Date();
    const secondAnniversary = new Date(joiningDate);
    secondAnniversary.setFullYear(secondAnniversary.getFullYear() + 2);
    secondAnniversary.setMonth(secondAnniversary.getMonth() - 1); // Set to the last month of the 2nd year

    return today >= secondAnniversary;
  };

  return (
    <div>
      <h2>Members Due for Renewal</h2>
      {/* Display email status message above the table */}
      {emailStatus && (
        <p
          className={`status-message ${
            emailStatus.includes("Failed") ? "error" : ""
          }`}
        >
          {emailStatus}
        </p>
      )}
      <br />
      {membersDue.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Renewal Due On</th>
              <th>Renewal Status</th>
              <th>Reminder</th>
              <th>Life Membership</th>
              <th>Life Membership</th>
            </tr>
          </thead>
          <tbody>
            {membersDue.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.memberName}</td>
                <td>{user.email}</td>
                <td>{user.mobile}</td>
                <td>{new Date(user.renewalDueOn).toLocaleDateString()}</td>
                <td>{user.renewalStatus}</td> {/* Display renewal status */}
                <td>
                  <button onClick={() => handleSendReminder(user)}>
                    Send Reminder
                  </button>
                </td>
                <td>
                  {/* Conditionally render the "Elevate to Life Member" button */}
                  {user.membershipType === "Annual" &&
                    isApproachingSecondAnniversary(
                      new Date(user.dateOfSubmission)
                    ) && (
                      <button
                        onClick={() => handleElevateToLifeMember(user)}
                        className={
                          sentInvites.includes(user.id)
                            ? "invite-sent-button"
                            : ""
                        }
                      >
                        Send Invite
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No members due for renewal.</p>
      )}
    </div>
  );
};

export default RenewalDueList;
