import logo from "../KMALogo.png"; // Import your logo image

export const addHeaderToPDF = (doc, yPos = 10) => {
  // Centered Text Wrapper Function
  const addCenteredText = (text, yPos, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const pageWidth = doc.internal.pageSize.getWidth();
    const xPosition = (pageWidth - textWidth) / 2;
    doc.text(text, xPosition, yPos);
  };

  const addRightAlignedText = (text, yPos, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const pageWidth = doc.internal.pageSize.getWidth();
    const xPosition = pageWidth - textWidth - 30;
    doc.text(text, xPosition, yPos);
  };

  const xPos = 20;
  // 1. Add the logo
  doc.addImage(logo, "PNG", xPos, yPos + 5, 30, 30); // Adjust position/size

  // 2. Add the header text
  doc.setFont("helvetica", "bold");
  addCenteredText("THE KARNATAKA MOUNTAINEERING ASSOCIATION (R)", yPos + 3, 14);
  doc.setFont("helvetica", "normal");

  // 3. Add the address lines (you can split into multiple lines)
  addCenteredText(
    "Room No 205, I Floor, Kanteerava Sports Complex – 2,",

    yPos + 10
  );
  addCenteredText("Kanteerava Stadium premises, Kasturba Road,", yPos + 17);
  addCenteredText("Bangalore – 560 001", yPos + 24);

  // 4. Add other details
  addCenteredText("T: +91 80 22113333  E: info@kmaindia.org", yPos + 31);
  addCenteredText(
    "W: www.kmaindia.org  FB: www.facebook.com/kmaindia",
    yPos + 37
  );

  doc.setFontSize(10);
  doc.text("To,", xPos, yPos + 64);
  doc.setFont("helvetica", "bold");
  doc.text("The Honorable Secretary", xPos, yPos + 70);
  doc.setFont("helvetica", "normal");
  doc.text("Karnataka Mountaineering Association", xPos, yPos + 76);
  doc.text(
    "‘Room No.205, I Floor, Kanteerava Sports Complex – 2,",
    xPos,
    yPos + 82
  );
  doc.text("Kanteerava Stadium premises, Kasturba Road,", xPos, yPos + 88);
  doc.text("Bangalore – 560 001", xPos, yPos + 94);

  doc.text("Dear Sir / Madam,", xPos, yPos + 110);
  doc.text(
    "I hereby apply for Membership of your Association, subscribing to the DECLARATION below and furnish  ",
    xPos,
    yPos + 122
  );
  doc.text(
    "my particulars overleaf which are true to the best of my knowledge and belief. I am interested in ",
    xPos,
    yPos + 128
  );
  /* doc.text("", xPos, yPos + 86);
  doc.text("", xPos, yPos + 92);
  doc.text("", xPos, yPos + 98); */
  doc.text(
    "Mountaineering & related activities. I undertake to abide by the Rules, Regulations and by laws of the",
    xPos,
    yPos + 134
  );
  doc.text("Association.", xPos, yPos + 140);
  /* doc.text("", xPos, yPos + 116);
  doc.text("", xPos, yPos + 122); */
  doc.setFont("helvetica", "bold");
  addCenteredText("DECLARATION", yPos + 146, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "I, as a member of the above Association hereby undertake to absolve the Association, its office bearers, ",
    xPos,
    yPos + 158
  );
  doc.text(
    "members of the Executive Committee and any other person or persons acting on its behalf, of any",
    xPos,
    yPos + 164
  );
  /* doc.text(" ", xPos, yPos + 146);
  doc.text("  ", xPos, yPos + 146); */
  doc.text(
    "disability or calamity to my person due to any accident during the outings, expeditions, training and",
    xPos,
    yPos + 170
  );
  /* doc.text("", xPos, yPos + 158);
  doc.text("", xPos, yPos + 164); */
  doc.text(
    "other activities held under the auspices of the Association. I undertake and sign this declaration willfully",
    xPos,
    yPos + 176
  );
  /* doc.text("", xPos, yPos + 176);
  doc.text("", xPos, yPos + 182); */
  doc.text("and with all my senses under control.", xPos, yPos + 182);
  doc.text("I hope you will kindly accept my membership.", xPos, yPos + 194);
  //doc.text("Yours Sincerely", xPos, yPos + 190);
  addRightAlignedText("Yours Sincerely", yPos + 200, 10);
  doc.text("Note – In case of Minor, Guardian should sign.", xPos, yPos + 240);
  //doc.text("Note – In case of Minor, Guardian should sign.", xPos, yPos + 206);
  addRightAlignedText("Signature and date", yPos + 240, 10);
  //doc.text("Signature and date", xPos, yPos + 212);
  // Return the updated yPos for the next content
  return yPos + 300; // Adjust spacing as needed
};
