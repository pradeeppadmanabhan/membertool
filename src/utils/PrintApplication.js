// src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../global.css";
import { addHeaderToPDF } from "./PDFHeader";
import { addCenteredText, addDeclarationToPDF } from "./PDFDeclaration";

const PrintApplication = (applicationData) => {
  const doc = new jsPDF();
  autoTable(doc, {
    /* options */
  }); // Apply the plugin

  const imageUrl = applicationData.imageURL; // Use the image URL from applicationData
  const signatureUrl = applicationData.signatureURL; // Use the signature URL from applicationData

  let yPos = addHeaderToPDF(doc);
  addDeclarationToPDF(doc, yPos, signatureUrl); // Add the declaration
  doc.addPage(); // Add a new page for the application form

  // Add the member image to the right side
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 20; // Height of the header

  addCenteredText(doc, "APPLICATION FOR MEMBERSHIP", headerHeight, 12); // Add title above the table

  const imageWidth = 40; // Adjust image width as needed
  const imageHeight = 50; // Adjust image height as needed
  const imageX = (pageWidth - imageWidth) / 2; // 10 for margin from right edge
  const imageY = headerHeight + 10; // Position above the table

  if (imageUrl) {
    const encodedImageUrl = encodeURI(imageUrl); // Encode the URL
    doc.addImage(
      encodedImageUrl,
      "JPEG",
      imageX,
      imageY,
      imageWidth,
      imageHeight
    );
  } else {
    console.error("Image URL is not available in applicationData.");
  }

  // 3. Table Creation (same as before)
  const tableColumnWidths = [50, 100];
  const memberTableRows = [
    // ... (Your table data) ...
    ["ID:", applicationData.id || "N/A"],
    ["Applicant's Full Name:", applicationData.memberName || "N/A"],
    ["Date of Birth:", applicationData.dob || "N/A"],
    ["Age:", applicationData.age || "N/A"],
    ["Gender:", applicationData.gender || "N/A"],
    [
      "Name of Father/Guardian/Husband:",
      applicationData.fatherGuardianName || "N/A",
    ],
    ["Address Line 1:", applicationData.addressLine1 || "N/A"],
    ["Address Line 2:", applicationData.addressLine2 || "N/A"],
    ["Address Line 3:", applicationData.addressLine3 || "N/A"],
    ["Mobile:", applicationData.mobile || "N/A"],
    ["Email ID:", applicationData.email || "N/A"],
    ["Academic Qualifications:", applicationData.qualifications || "N/A"],
    ["Profession:", applicationData.profession || "N/A"],
    ["Athletic Background:", applicationData.athleticBackground || "N/A"],
    ["Experience in Trekking:", applicationData.trekkingExperience || "N/A"],
    ["Hobbies:", applicationData.hobbies || "N/A"],
    ["History of serious illness:", applicationData.illnessHistory || "N/A"],
    ["Present General Health:", applicationData.generalHealth || "N/A"],
    ["Blood Group:", applicationData.bloodGroup || "N/A"],

    ["Mountaineering Certifications:", applicationData.certifications || "N/A"],
    ["Recommended By:", applicationData.recommendedByName || "N/A"],

    [
      "Date of Application Submission:",
      new Date(applicationData.dateOfSubmission).toLocaleDateString() || "N/A",
    ],
    // ... add other fields in the same format ...
  ];

  const memberTableStartY = imageY + imageHeight + 10; // Start the table below the header

  // Add the table to the PDF
  doc.autoTable({
    head: [],
    body: memberTableRows,
    startX: 20, // Start the table from the left margin
    startY: memberTableStartY, // Start the table below the header
    columnStyles: {
      0: { cellWidth: tableColumnWidths[0], fontStyle: "bold" },
      1: { cellWidth: tableColumnWidths[1] },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // Add Emergency Contact Info.
  doc.addPage(); // Add a new page for the emergency contact details
  const emergencyContactTableRows = [
    ["ID:", applicationData.id || "N/A"],
    ["Applicant's Full Name:", applicationData.memberName || "N/A"],
    ["Emergency Contact Name:", applicationData.emergencyContactName || "N/A"],
    [
      "Emergency Contact Phone:",
      applicationData.emergencyContactPhone || "N/A",
    ],
    [
      "Emergency Contact Email:",
      applicationData.emergencyContactEmail || "N/A",
    ],
    [
      "Emergency Contact Relationship:",
      applicationData.emergencyContactRelationship || "N/A",
    ],
  ];
  addCenteredText(doc, "EMERGENCY CONTACT DETAILS", headerHeight, 12);
  doc.autoTable({
    head: [],
    body: emergencyContactTableRows,
    startY: headerHeight + 10, // Start the table below the header
    columnStyles: {
      0: { cellWidth: tableColumnWidths[0], fontStyle: "bold" },
      1: { cellWidth: tableColumnWidths[1] },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  doc.addPage(); // Add a new page for the payment details

  const payments = applicationData.payments || [];
  const latestPayment = payments[payments.length - 1];
  //console.log("Latest Payment:", latestPayment);

  const paymentTableRows = [
    // ... (Your table data) ...
    ["ID:", applicationData.id || "N/A"],
    ["Applicant's Full Name:", applicationData.memberName || "N/A"],
    ["Amount:", "Rs." + latestPayment.amount || "N/A"],
    [
      "Date of Payment:",
      new Date(latestPayment.dateOfPayment).toLocaleDateString(),
    ],
    ["Payment Mode:", latestPayment.paymentMode || "N/A"],
    ["Receipt Number:", latestPayment.receiptNumber || "N/A"],
    ["Payment ID:", latestPayment.paymentID || "N/A"],
    ["Membership Type:", applicationData.currentMembershipType || "N/A"],
    [
      "Renewal Due on:",
      new Date(applicationData.renewalDueOn).toLocaleDateString() || "N/A",
    ],
  ];

  addCenteredText(doc, "PAYMENT DETAILS", headerHeight, 12); // Add title above the table

  // Add the payment details table to the PDF
  doc.autoTable({
    head: [],
    body: paymentTableRows,
    startY: headerHeight + 10, // Start the table below the header
    columnStyles: {
      0: { cellWidth: tableColumnWidths[0], fontStyle: "bold" },
      1: { cellWidth: tableColumnWidths[1] },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // Save the PDF after the table is added
  doc.save(`application_${applicationData.id}.pdf`);
};

export default PrintApplication;
