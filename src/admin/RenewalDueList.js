// src/Admin/RenewalDueList.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import "../global.css"; // Import your CSS file
import sendEmail from "../utils/SendEmail";

const RenewalDueList = () => {
  const [membersDue, setMembersDue] = useState([]);

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

  return (
    <div>
      <h2>Members Due for Renewal</h2>
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