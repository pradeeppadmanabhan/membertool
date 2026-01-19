// src/Admin/RenewalDueList.js
import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebase";
import "../global.css"; // Import your CSS file
import sendEmail from "../utils/SendEmail";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { isEligibleForLifeMembership } from "../utils/EligibilityUtils";

const RenewalDueList = () => {
  const [membersDue, setMembersDue] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null); // State to track email status
  const [sentInvites, setSentInvites] = useState([]); // Array to track sent invites

  const TOAST_DISPLAY_DURATION = 2000; // Duration to display toast messages (in milliseconds)
  //let emailStatusTimeout = null; // Timeout ID for clearing email status

  useEffect(() => {
    const dataRef = ref(database, "users");

    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const today = new Date();

        const dueMembers = Object.values(data).filter((user) => {
          if (user.currentMembershipType !== "Annual") {
            return false;
          }

          const renewalDate = new Date(user.renewalDueOn);
          // Check if renewal is due within the next month OR within the past month
          return renewalDate <= today;
        });

        // Update applicationStatus to "Due" in the database
        dueMembers.forEach((user) => {
          const userRef = ref(database, `users/${user.id}`);
          update(userRef, { applicationStatus: "Due" });
        });

        // Calculate renewal status for each member
        const membersWithStatus = dueMembers.map((user) => {
          const renewalDate = new Date(user.renewalDueOn);

          const renewalStatus = renewalDate <= today ? "Due" : "Active";

          return { ...user, renewalStatus }; // Add renewalStatus to user object
        });

        setMembersDue(membersWithStatus);
      }
    });
  }, []);

  const handleSendReminder = async (user) => {
    const toastId = toast.info(`Sending reminder to ${user.memberName}...`, {
      autoClose: false, // Keep the toast open until updated
    });

    try {
      if (!user.renewalDueOn || isNaN(new Date(user.renewalDueOn).getTime())) {
        toast.update(toastId, {
          render: `${user.memberName} has an invalid renewal date.`,
          type: "error",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.error(`${user.memberName} has an invalid renewal date.`);
        return;
      }
      const today = new Date();
      const dueDate = new Date(user.renewalDueOn);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

      // Format the renewalDueOn date to a human-readable format
      const formattedDueDate = dueDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let subjectLine = "";
      let message = "";

      if (daysDiff > 0) {
        subjectLine = `KMA Membership Renewal Reminder - ${daysDiff} days left`;
        message = `Dear ${user.memberName},\n\nThis is a friendly reminder that your KMA membership is due for renewal in ${daysDiff} days, on ${formattedDueDate}.
        \n\nPlease take a moment to renew your membership to continue enjoying the benefits of being a KMA member.
        \n\nTo renew your membership, please visit your profile at: https://members.kmaindia.org\n\nIf you have any questions or need assistance, feel free to reach out to us.\n\nWe appreciate your continued support and look forward to having you as a valued member of KMA!

        \n\nSincerely,\nThe KMA Team`;
      } else if (daysDiff === 0) {
        subjectLine = `KMA Membership Renewal Due Today`;
        message = `Dear ${user.memberName},\n\nThis is a reminder that your KMA membership is due for renewal today, ${formattedDueDate}.
        \n\nPlease take a moment to renew your membership to continue enjoying the benefits of being a KMA member.
        \n\nTo renew your membership, please visit your profile at: https://members.kmaindia.org\n\nIf you have any questions or need assistance, feel free to reach out to us.\n\nWe appreciate your continued support and look forward to having you as a valued member of KMA!

        \n\nSincerely,\nThe KMA Team`;
      } else {
        subjectLine = `KMA Membership Renewal - ${Math.abs(
          daysDiff
        )} days overdue`;
        message = `Dear ${
          user.memberName
        },\n\nThis is a reminder that your KMA membership was due for renewal ${Math.abs(
          daysDiff
        )} days ago, on ${formattedDueDate}.\n\nPlease take a moment to renew your membership to continue enjoying the benefits of being a KMA member.
        \n\nTo renew your membership, please visit your profile at: https://members.kmaindia.org\n\nIf you have any questions or need assistance, feel free to reach out to us.\n\nWe appreciate your continued support and look forward to having you as a valued member of KMA!

        \n\nSincerely,\nThe KMA Team`;
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
        toast.update(toastId, {
          render: `Reminder email sent to ${user.memberName}!`,
          type: "success",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.log("Reminder email sent successfully!");
      } else {
        // Handle email sending error, e.g., show an error message
        toast.update(toastId, {
          render: `Failed to send reminder email to ${user.memberName}.`,
          type: "error",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.error("Failed to send reminder email.");
      }
    } catch (error) {
      toast.update(toastId, {
        render: `Error sending reminder email to ${user.memberName}: ${error.message}`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error("Error sending reminder:", error);
      // Handle error appropriately
    }
  };

  const handleElevateToLifeMember = async (user) => {
    const toastId = toast.info(
      `Processing life membership invitation for ${user.memberName}...`,
      {
        autoClose: false, // Keep the toast open until updated
      }
    );

    if (
      !user.dateOfSubmission ||
      isNaN(new Date(user.dateOfSubmission).getTime())
    ) {
      toast.update(toastId, {
        render: `${user.memberName} has an invalid joining date.`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error(`${user.memberName} has an invalid joining date.`);
      return;
    }

    if (!isEligibleForLifeMembership(new Date(user.dateOfSubmission))) {
      toast.update(toastId, {
        render: `${user.memberName} is not eligible for Life Membership.`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error(`${user.memberName} is not eligible for Life Membership.`);
      return;
    }

    try {
      try {
        // Update isUpgradeAllowed flag in the database
        const userRef = ref(database, `users/${user.id}`);
        await update(userRef, { isUpgradeAllowed: true });
      } catch (err) {
        console.error("Error updating isUpgradeAllowed flag:", err);
      }

      // 1. Construct the payment link [TODO: Update Payment Gateway link]
      //const profileLink = `http://localhost:3000`; //TODO: For testing only
      const profileLink = `https://members.kmaindia.org`;

      // 2. Prepare email content
      const subjectLine = "Invitation to Upgrade to KMA Life Membership";
      const message = `Dear ${user.memberName},

We are pleased to offer you an exclusive opportunity to upgrade your KMA membership to a Life Membership!

As a valued member, we recognize your continued support and dedication to our association. Upgrading to a Life Membership offers numerous benefits, including:

* Lifetime access to KMA events and activities
* Exemption from annual renewal fees
* ... And a host of other benefits

To upgrade your membership, simply click on the following link, which will direct you to your profile from where you can upgrade to Life Membership: 

${profileLink}

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
        toast.update(toastId, {
          render: `Life membership invitation email sent to ${user.memberName}!`,
          type: "success",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.log("Life membership invitation email sent successfully!");
        setEmailStatus(`Invitation sent successfully to ${user.memberName}!`); // Set success message with name
        setSentInvites([...sentInvites, user.id]);
      } else {
        toast.update(toastId, {
          render: `Failed to send life membership invitation email to ${user.memberName}.`,
          type: "error",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.error("Failed to send life membership invitation email.");
        setEmailStatus(`Failed to send invitation to ${user.memberName}.`); // Set error message with name
      }

      // Set a timeout to clear the emailStatus after 5 seconds
      setTimeout(() => {
        setEmailStatus(null);
      }, TOAST_DISPLAY_DURATION); // TOAST_DISPLAY_DURATION milliseconds = 5 seconds
    } catch (error) {
      toast.update(toastId, {
        render: `Error sending life membership invitation email to ${user.memberName}: ${error.message}`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error("Error sending life membership invitation:", error);
      setEmailStatus(
        `Error sending invitation to ${user.memberName}, due to ${error.message}`
      ); // Set error message with name
    }
  };

  return (
    <div className="mt-5">
      <ToastContainer /> {/* Toast container for notifications */}
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
                <td>{user.renewalStatus}</td>
                <td>
                  <button onClick={() => handleSendReminder(user)}>
                    Send Reminder
                  </button>
                </td>
                <td>
                  {/* Conditionally render the "Elevate to Life Member" button */}

                  <button
                    onClick={() => handleElevateToLifeMember(user)}
                    disabled={
                      user.currentMembershipType !== "Annual" ||
                      !isEligibleForLifeMembership(
                        new Date(user.dateOfSubmission)
                      )
                    }
                    className={
                      sentInvites.includes(user.id) ? "invite-sent-button" : ""
                    }
                  >
                    Send Invite
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
