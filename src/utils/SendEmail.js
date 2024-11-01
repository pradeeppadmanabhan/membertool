// src/utils/SendEmail.js
import emailjs from "@emailjs/browser";

const YOUR_SERVICE_ID = process.env.REACT_APP_EMAIL_SERVICE_ID;
const YOUR_TEMPLATE_ID = process.env.REACT_APP_EMAIL_TEMPLATE_ID;
const YOUR_PUBLIC_KEY = process.env.REACT_APP_EMAIL_PUBLIC_KEY;

const sendEmail = async (templateParams) => {
  try {
    const response = await emailjs.send(
      YOUR_SERVICE_ID,
      YOUR_TEMPLATE_ID,
      templateParams,
      {
        publicKey: YOUR_PUBLIC_KEY,
      }
    );

    console.log("Email sent successfully:", response);
    alert("Email sent successfully!");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    alert("Error sending email:", error);
    return false;
  }
};

export default sendEmail;
