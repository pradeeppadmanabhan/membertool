// src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../global.css";
import { addHeaderToPDF } from "./PDFHeader";
import { addDeclarationToPDF } from "./PDFDeclaration";

const PrintApplication = (applicationData) => {
  const doc = new jsPDF();
  autoTable(doc, {
    /* options */
  }); // Apply the plugin

  let yPos = addHeaderToPDF(doc);
  yPos = addDeclarationToPDF(doc, yPos);

  /* // Add the member image to the right side
  const pageWidth = doc.internal.pageSize.getWidth();
  const imageWidth = 50; // Adjust image width as needed
  const imageX = pageWidth - imageWidth - 10; // 10 for margin from right edge
  const imageY = yPos - 40; // Position above the table

  if (applicationData.imageURL) {
    const encodedImageUrl = encodeURI(applicationData.imageURL); // Encode the URL
    doc.addImage(
      encodedImageUrl,
      "JPEG",
      imageX,
      imageY,
      imageWidth,
      imageWidth
    );
  } */

  // 3. Table Creation (same as before)
  const tableColumnWidths = [80, 80];
  const tableRows = [
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
    ["Membership Type:", applicationData.membershipType || "N/A"],
    ["Payment Transaction No:", "<Transaction No>"],
    ["Receipt No: / Date: ", "<Receipt No> / <Date>"],
    [
      "Recommended By:",
      applicationData.recommendedByName ||
        "N/A" + applicationData.recommendedByID ||
        "N/A",
    ],
    //["Recommended By -ID:", applicationData.recommendedByID || "N/A"],
    // ... add other fields in the same format ...
  ];

  // Add the table to the PDF
  doc.autoTable({
    head: [],
    body: tableRows,
    startY: yPos, // Start the table below the header
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
