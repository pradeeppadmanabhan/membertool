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

  // 1. Add the logo
  doc.addImage(logo, "PNG", 10, yPos + 5, 30, 30); // Adjust position/size

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

  // Return the updated yPos for the next content
  return yPos + 50; // Adjust spacing as needed
};
