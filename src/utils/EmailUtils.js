export const prepareEmailData = (userData, receiptNumber, isRenewal) => {
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
    subject: isRenewal
      ? `KMA Membership Renewal - ${userData.memberName} (ID: ${userData.id}) (Receipt Number: ${receiptNumber})`
      : `KMA New Membership Application - ${userData.memberName} (ID: ${userData.id}) (Receipt Number: ${receiptNumber})`,
    message: emailBody,
    contentType: "text/html",
  };
};
