// src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
//import logo from "../KMALogo.png";
import "../global.css";
import React from "react"; // Import React
import { renderToString } from "react-dom/server"; // For server-side rendering
import Header from "../components/Header"; // Import your Header component

const PrintApplication = (applicationData) => {
  const doc = new jsPDF();
  autoTable(doc, {
    /* options */
  }); // Apply the plugin

  // 1. Render the Header Component to HTML
  const headerHtml = renderToString(<Header />);

  // 2. Use jsPDF's html() method to add the header HTML
  doc.html(headerHtml, {
    callback: (doc) => {
      // Set the starting position for the table content
      let yPos = 50; // Adjust as needed based on header height

      // 3. Table Creation (same as before)
      const tableColumnWidths = [40, 80];
      const tableRows = [
        // ... (Your table data) ...
        ["ID:", applicationData.id || "N/A"],
        ["Applicant's Full Name:", applicationData.memberName || "N/A"],
        ["Date of Birth:", applicationData.dob || "N/A"],
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
          fontSize: 10,
          cellPadding: 4,
        },
      });

      // Save the PDF after the table is added
      doc.save(`application_${applicationData.id}.pdf`);
    },
    x: 10, // Adjust horizontal position if needed
    y: 10, // Adjust vertical position if needed,
  });

  /* // 2. Create a temporary div to hold the rendered HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = headerHtml;

  // 3. Get the logo image element from the rendered Header
  const logoImage = tempDiv.querySelector(".logo-image"); // Use your logo image class
  const logoSrc = logoImage ? logoImage.src : logo; // Use default logo if not found

  // 4. Add the logo to the PDF
  doc.addImage(logoSrc, "PNG", 10, 10, 35, 35); */

  /* // 5. Add the application title below the header
  doc.setFontSize(16);
  doc.text("KMA Membership Application", 50, 25);
  doc.setFontSize(11);

  // 6. Table Creation
  const tableColumnWidths = [40, 80]; // Adjust column widths as needed
  const tableRows = [
    ["ID:", applicationData.id || "N/A"],
    ["Applicant's Full Name:", applicationData.memberName || "N/A"],
    ["Date of Birth:", applicationData.dob || "N/A"],
    // ... add other fields in the same format ...
  ];

  // Set starting position for the table
  let yPos = 50; // Adjust vertical position as needed */

  // Add the table to the PDF
  /*  autoTable(doc, {
    head: [], // No header rows
    body: tableRows,
    startY: yPos,
    columnStyles: {
      0: { cellWidth: tableColumnWidths[0], fontStyle: "bold" }, // First column (labels)
      1: { cellWidth: tableColumnWidths[1] }, // Second column (values)
    },
    styles: {
      fontSize: 10, // Adjust font size as needed
      cellPadding: 4, // Adjust cell padding as needed
    },
  });

  doc.save(`application_${applicationData.id}.pdf`); */
};

export default PrintApplication;

/* // src/utils/generatePDF.js
import { jsPDF } from "jspdf";
import logo from "../KMALogo.png";

const generatePDF = (applicationData) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height; // Get the page height

  // Add logo to PDF
  const imgProps = new Image();
  imgProps.src = logo;
  doc.addImage(imgProps, "PNG", 10, 10, 35, 35);

  // Add application details to PDF
  doc.setFontSize(16);
  doc.text("KMA Membership Application", 50, 25);
  doc.setFontSize(11);

  let yPos = 65; // Starting Y position for content
  const lineHeight = 10; // Line height for text
  const margin = 10; // Margin from bottom of page for page break

  // Function to add a field to the PDF
  const addField = (label, value) => {
    // Check if adding this field would exceed the page height
    if (yPos + lineHeight > pageHeight - margin) {
      doc.addPage(); // Add a new page
      yPos = 10; // Reset Y position for the new page
      doc.setFontSize(11); // Reset font size (if needed)
    }

    doc.text(`${label}: ${value || "N/A"}`, 10, yPos);
    yPos += lineHeight;
  };

  // Add all form fields dynamically
  addField("ID", applicationData.id);
  addField("Applicant's Full Name", applicationData.memberName);
  addField("Date of Birth", applicationData.dob);
  addField("Age", applicationData.age);
  addField("Gender", applicationData.gender);
  addField(
    "Name of Father/Guardian/Husband",
    applicationData.fatherGuardianName
  );
  addField("Address Line 1", applicationData.addressLine1);
  addField("Address Line 2", applicationData.addressLine2);
  addField("Address Line 3", applicationData.addressLine3);
  addField("Landline", applicationData.landline);
  addField("Mobile", applicationData.mobile);
  addField("Email ID", applicationData.email);
  addField("Academic Qualifications", applicationData.qualifications);
  addField("Profession", applicationData.profession);
  addField("Athletic Background", applicationData.athleticBackground);
  addField("Experience in Trekking", applicationData.trekkingExperience);
  addField("Hobbies", applicationData.hobbies);
  addField("History of serious illness", applicationData.illnessHistory);
  addField("Present General Health", applicationData.generalHealth);
  addField("Blood Group", applicationData.bloodGroup);
  addField("Membership Type", applicationData.membershipType);
  addField("Recommended By -Name", applicationData.recommendedByName);
  addField("Recommended By -ID", applicationData.recommendedByID);
  addField("Application Status", applicationData.applicationStatus);
  addField(
    "Date of Submission",
    applicationData.dateOfSubmission
      ? new Date(applicationData.dateOfSubmission).toLocaleDateString()
      : "N/A"
  );
  addField(
    "Date of Approval",
    applicationData.dateOfApproval
      ? new Date(applicationData.dateOfApproval).toLocaleDateString()
      : "N/A"
  );
  // ... add other fields as needed ...

  doc.save(`application_${applicationData.id}.pdf`);
};

export default generatePDF;
 */
