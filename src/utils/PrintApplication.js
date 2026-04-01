// src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../global.css";
import { addHeaderToPDF } from "./PDFHeader";
import { addCenteredText, addDeclarationToPDF } from "./PDFDeclaration";
import { formatDate } from "./DateUtils";

const PrintApplication = (applicationData) => {
  const FONTSIZE = 7; // Set a default font size for the PDF
  const CELL_PADDING = 2; // Set a default cell padding for the tables

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
      "WEBP",
      imageX,
      imageY,
      imageWidth,
      imageHeight,
    );
  } else {
    console.error("Image URL is not available in applicationData.");
  }

  // 3. Table Creation (same as before)
  //const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15; // Margin on both sides
  const availableWidth = pageWidth - margin * 2; // Total width available for table

  // Calculate proportional column widths (50:100 ratio = 1:2)
  const totalColumnRatio = 3; // 1 + 2
  const column0Width = (availableWidth / totalColumnRatio) * 1; // 1/3 of available width
  const column1Width = (availableWidth / totalColumnRatio) * 2; // 2/3 of available width

  const memberTableRows = [
    // ... (Your table data) ...
    ["ID:", applicationData.id || "N/A"],
    ["Applicant's Full Name:", applicationData.memberName || "N/A"],
    ["Date of Birth:", formatDate(applicationData.dob) || "N/A"],
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

    [
      "Mountaineering Certifications:",
      applicationData.mountaineeringCertifications || "N/A",
    ],
    ["Recommended By:", applicationData.recommendedByName || "N/A"],

    [
      "Date of Application Submission:",
      formatDate(applicationData.dateOfSubmission) || "N/A",
    ],
    // ... add other fields in the same format ...
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

  const memberTableStartY = imageY + imageHeight + 10; // Start the table below the header

  // Add the table to the PDF
  doc.autoTable({
    head: [],
    body: memberTableRows,
    startX: margin, // Start from the left margin
    startY: memberTableStartY, // Start the table below the header
    tableWidth: availableWidth, // Use the full available width
    columnStyles: {
      0: { cellWidth: column0Width, fontStyle: "bold" },
      1: { cellWidth: column1Width },
    },
    styles: {
      fontSize: FONTSIZE,
      cellPadding: CELL_PADDING,
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
    ["Date of Payment:", formatDate(latestPayment.dateOfPayment)],
    ["Payment Mode:", latestPayment.paymentMode || "N/A"],
    ["Receipt Number:", latestPayment.receiptNumber || "N/A"],
    ["Payment ID:", latestPayment.paymentID || "N/A"],
    ["Membership Type:", applicationData.currentMembershipType || "N/A"],
    ["Renewal Due on:", formatDate(applicationData.renewalDueOn) || "N/A"],
  ];

  addCenteredText(doc, "PAYMENT DETAILS", headerHeight, 12); // Add title above the table

  // Add the payment details table to the PDF
  doc.autoTable({
    head: [],
    body: paymentTableRows,
    startX: margin, // Use same margin as member table
    startY: headerHeight + 10, // Start the table below the header
    tableWidth: availableWidth, // Use the full available width
    columnStyles: {
      0: { cellWidth: column0Width, fontStyle: "bold" },
      1: { cellWidth: column1Width },
    },
    styles: {
      fontSize: FONTSIZE,
      cellPadding: CELL_PADDING,
    },
  });

  // Save the PDF after the table is added
  doc.save(`application_${applicationData.id}.pdf`);
};

export default PrintApplication;
