export const addDeclarationToPDF = (doc, yPos = 50) => {
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

  doc.setFontSize(10);
  doc.text("To,", xPos, yPos + 4);
  doc.setFont("helvetica", "bold");
  doc.text("The Honorable Secretary", xPos, yPos + 10);
  doc.setFont("helvetica", "normal");
  doc.text("Karnataka Mountaineering Association", xPos, yPos + 16);
  doc.text(
    "‘Room No.205, I Floor, Kanteerava Sports Complex – 2,",
    xPos,
    yPos + 22
  );
  doc.text("Kanteerava Stadium premises, Kasturba Road,", xPos, yPos + 28);
  doc.text("Bangalore – 560 001", xPos, yPos + 34);

  doc.text("Dear Sir / Madam,", xPos, yPos + 50);
  doc.text(
    "I hereby apply for Membership of your Association, subscribing to the DECLARATION below and furnish  ",
    xPos,
    yPos + 62
  );
  doc.text(
    "my particulars overleaf which are true to the best of my knowledge and belief. I am interested in ",
    xPos,
    yPos + 68
  );
  doc.text(
    "Mountaineering & related activities. I undertake to abide by the Rules, Regulations and by laws of the",
    xPos,
    yPos + 74
  );
  doc.text("Association.", xPos, yPos + 80);
  doc.setFont("helvetica", "bold");
  addCenteredText("DECLARATION", yPos + 92, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "I, as a member of the above Association hereby undertake to absolve the Association, its office bearers, ",
    xPos,
    yPos + 108
  );
  doc.text(
    "members of the Executive Committee and any other person or persons acting on its behalf, of any",
    xPos,
    yPos + 114
  );
  doc.text(
    "disability or calamity to my person due to any accident during the outings, expeditions, training and",
    xPos,
    yPos + 120
  );
  doc.text(
    "other activities held under the auspices of the Association. I undertake and sign this declaration willfully",
    xPos,
    yPos + 126
  );
  doc.text("and with all my senses under control.", xPos, yPos + 132);
  doc.text("I hope you will kindly accept my membership.", xPos, yPos + 144);
  addRightAlignedText("Yours Sincerely", yPos + 150, 10);
  doc.text("Note – In case of Minor, Guardian should sign.", xPos, yPos + 190);
  addRightAlignedText("Signature and date", yPos + 190, 10);
  // Return the updated yPos for the next content
  return yPos + 220; // Adjust spacing as needed
};
