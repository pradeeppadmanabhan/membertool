import { fetchMemberData } from "./PaymentUtils";

export const prepareRenewalReminderEmail = (user, daysDiff) => {
  const dueDate = new Date(user.renewalDueOn);
  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let subjectLine = "";
  let message = "";

  if (daysDiff > 0) {
    subjectLine = `KMA Membership Renewal Reminder - ${daysDiff} days left`;
    message = `<p>Dear ${user.memberName},</p>
<p>This is a friendly reminder that your KMA membership is due for renewal in ${daysDiff} days, on ${formattedDueDate}.</p>
<p>Please take a moment to renew your membership to continue enjoying the benefits of being a KMA member.</p>
<p>To renew your membership, please visit your profile at: <a href="https://members.kmaindia.org">https://members.kmaindia.org</a></p>
<p>If you have any questions or need assistance, feel free to reach out to us.</p>
<p>We appreciate your continued support and look forward to having you as a valued member of KMA!</p>
<p>Sincerely,<br>The KMA Team</p>`;
  } else if (daysDiff === 0) {
    subjectLine = `KMA Membership Renewal Due Today`;
    message = `<p>Dear ${user.memberName},</p>
<p>This is a reminder that your KMA membership is due for renewal today, ${formattedDueDate}.</p>
<p>Please take a moment to renew your membership to continue enjoying the benefits of being a KMA member.</p>
<p>To renew your membership, please visit your profile at: <a href="https://members.kmaindia.org">https://members.kmaindia.org</a></p>
<p>If you have any questions or need assistance, feel free to reach out to us.</p>
<p>We appreciate your continued support and look forward to having you as a valued member of KMA!</p>
<p>Sincerely,<br>The KMA Team</p>`;
  } else {
    subjectLine = `KMA Membership Renewal - ${Math.abs(daysDiff)} days overdue`;
    message = `<p>Dear ${user.memberName},</p>
<p>This is a reminder that your KMA membership was due for renewal ${Math.abs(daysDiff)} days ago, on ${formattedDueDate}.</p>
<p>Please take a moment to renew your membership to continue enjoying the benefits of being a KMA member.</p>
<p>To renew your membership, please visit your profile at: <a href="https://members.kmaindia.org">https://members.kmaindia.org</a></p>
<p>If you have any questions or need assistance, feel free to reach out to us.</p>
<p>We appreciate your continued support and look forward to having you as a valued member of KMA!</p>
<p>Sincerely,<br>The KMA Team</p>`;
  }

  return { subject: subjectLine, message };
};

export const prepareLifeMembershipInvitationEmail = (user) => {
  const profileLink = `https://members.kmaindia.org`;

  const subjectLine = "Invitation to Upgrade to KMA Life Membership";
  const message = `<p>Dear ${user.memberName},</p>
<p>We are pleased to offer you an exclusive opportunity to upgrade your KMA membership to a Life Membership!</p>
<p>As a valued member, we recognize your continued support and dedication to our association. Upgrading to a Life Membership offers numerous benefits, including:</p>
<ul>
<li>Lifetime access to KMA events and activities</li>
<li>Exemption from annual renewal fees</li>
<li>... And a host of other benefits</li>
</ul>
<p>To upgrade your membership, simply click on the following link, which will direct you to your profile from where you can upgrade to Life Membership:</p>
<p><a href="${profileLink}">${profileLink}</a></p>
<p>We encourage you to seize this opportunity and join our esteemed community of Life Members.</p>
<p>If you have any questions or require further assistance, please do not hesitate to contact us.</p>
<p>Sincerely,<br>The KMA Team</p>`;

  return { subject: subjectLine, message };
};

export const prepareEmailData = async (
  memberID,
  receiptNumber,
  isRenewal,
  isUpgrade
) => {
  try {
    const userData = await fetchMemberData(memberID);

    const payments = userData.payments || [];
    const latestPayment = payments[payments.length - 1];
    //console.log("userData:", userData);
    //console.log("Latest Payment:", latestPayment);

    const paymentTableRows = `
     <tr><td>Amount</td><td>₹${latestPayment.amount}</td></tr>
      <tr><td>Date of Payment</td><td>${new Date(
        latestPayment.dateOfPayment
      ).toLocaleDateString()}</td></tr>
      <tr><td>Payment Mode</td><td>${latestPayment.paymentMode}</td></tr>
      <tr><td>Receipt Number</td><td>${receiptNumber}</td></tr>
      <tr><td>Payment ID</td><td>${latestPayment.paymentID || "N/A"}</td></tr>
    `;

    const memberTableRows = isRenewal
      ? `
        <tr><td>Member ID</td><td>${userData.id}</td></tr>
        <tr><td>Member Name</td><td>${userData.memberName}</td></tr>
        <tr><td></td></tr>
        `
      : isUpgrade
        ? `<tr><td>Life Member ID</td><td>${userData.lifeMemberID}</td></tr>
        <tr><td>Original Member ID</td><td>${userData.id}</td></tr>
        <tr><td>Member Name</td><td>${userData.memberName}</td></tr>
        <tr><td></td></tr>        
        `
        : `
        <tr><td>Member ID</td><td>${userData.id}</td></tr>
        <tr><td>Member Name</td><td>${userData.memberName}</td></tr>
        
        <tr><td>Age</td><td>${userData.age}</td></tr>
        <tr><td>Date of Birth</td><td>${new Date(
          userData.dob
        ).toLocaleDateString()}</td></tr>
        <tr><td>Gender</td><td>${userData.gender}</td></tr>
        <tr><td>Father/Guardian Name</td><td>${
          userData.fatherGuardianName
        }</td></tr>
        <tr><td>Address</td><td>${userData.addressLine1}, ${
          userData.addressLine2
        }, ${userData.addressLine3}</td></tr>        
        <tr><td>Mobile</td><td>${userData.mobile}</td></tr>
        <tr><td>Email</td><td>${userData.email}</td></tr>
        <tr><td>Qualifications</td><td>${userData.qualifications}</td></tr>
        <tr><td>Profession</td><td>${userData.profession}</td></tr>
        <tr><td>Athletic Background</td><td>${
          userData.athleticBackground
        }</td></tr>
        <tr><td>Trekking Experience</td><td>${
          userData.trekkingExperience
        }</td></tr>
        <tr><td>Hobbies</td><td>${userData.hobbies}</td></tr>
        <tr><td>Illness History</td><td>${userData.illnessHistory}</td></tr>
        <tr><td>Present Health</td><td>${userData.generalHealth}</td></tr>
        <tr><td>Blood Group</td><td>${userData.bloodGroup}</td></tr>
        <tr><td>Emergency Contact Name</td><td>${
          userData.emergencyContactName
        }</td></tr>
        <tr><td>Emergency Contact Number</td><td>${
          userData.emergencyContactPhone
        }</td></tr>
        <tr><td>Emergency Contact Relationship</td><td>${
          userData.emergencyContactRelationship
        }</td></tr>
        <tr><td>Emergency Contact Email</td><td>${
          userData.emergencyContactEmail
        }</td></tr>
        <tr><td>Mountaineering Certifications</td><td>${
          userData.mountaineeringCertifications
        }</td></tr>

        <tr><td>Recommended By</td><td>${userData.recommendedByName}</td></tr>

        <tr><td>Membership Type</td><td>${
          userData.currentMembershipType
        }</td></tr>        
        
        <tr><td>Renewal Due On</td><td>${new Date(
          userData.renewalDueOn
        ).toLocaleDateString()}</td></tr>
        <tr><td>Date of Submission</td><td>${new Date(
          userData.dateOfSubmission
        ).toLocaleDateString()}</td></tr>
        <tr><td></td></tr>
        
        `;

    const emailBody = `
      <p>Dear ${userData.memberName},</p>
      <br />
      <p>${isRenewal ? "Membership Renewal" : isUpgrade ? "Membership Upgrade" : "New Membership"} Details:</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Description</th><th>Value</th></tr>
        </thead>
        <tbody>
          ${memberTableRows + paymentTableRows}
        </tbody>
      </table>
      <p>We look forward to having you as part of The Karnataka Mountaineering Association.</p>
    `;

    return {
      to_name: userData.memberName || "Member",
      to_email: userData.email,
      subject: isRenewal
        ? `KMA Membership Renewal - ${userData.memberName} (ID: ${userData.id}) (Receipt Number: ${receiptNumber})`
        : isUpgrade
          ? `KMA Membership Upgrade - ${userData.memberName} (ID: ${userData.lifeMemberID}) (Receipt Number: ${receiptNumber})`
          : `KMA New Membership Application - ${userData.memberName} (ID: ${userData.id}) (Receipt Number: ${receiptNumber})`,
      message: emailBody,
      contentType: "text/html",
    };
  } catch (error) {
    console.error("Error preparing email data:", error);
    return null;
  }
};
