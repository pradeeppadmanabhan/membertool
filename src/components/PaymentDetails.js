// src/components/PaymentDetails.js
import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { ref, update } from "firebase/database";
import { database, storage } from "../firebase";

const PaymentDetails = () => {
  // Access data passed from MembershipApplicationForm
  const { memberID, membershipType } = useParams();
  const navigate = useNavigate();

  const [paymentData, setPaymentData] = useState({
    paymentMode: "",
    transactionReference: "",
    transactionScreenshot: null,
    amount:
      membershipType === "Annual" ? 200 : membershipType === "Life" ? 2000 : 0,
  });
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //console.log("memberId:", memberID, "membershipType:", membershipType);
  if (!memberID || !membershipType) {
    return (
      <div>
        Error: Invalid URL. Please provide valid member ID and membership type.
      </div>
    );
  }
  const handlePaymentModeChange = (e) => {
    setPaymentData((prev) => ({
      ...prev,
      paymentMode: e.target.value,
      transactionReference: "",
      transactionScreenshot: null,
    }));
    setErrors((prev) => ({ ...prev, paymentMode: "" }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          transactionScreenshot: "Only JPEG/JPG and PNG images are allowed.",
        }));
      } else if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          transactionScreenshot: "Image size must be less than 2MB.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, transactionScreenshot: "" }));
        setPaymentData((prev) => ({ ...prev, transactionScreenshot: file }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { paymentMode, transactionReference, transactionScreenshot } =
      paymentData;

    // Validate inputs
    if (!paymentMode) {
      setErrors({ paymentMode: "Payment mode is required." });
      return;
    }
    if (paymentMode === "Bank Transfer") {
      if (!transactionReference) {
        setErrors((prev) => ({
          ...prev,
          transactionReference: "Transaction Reference is required.",
        }));
        setIsSubmitting(false);
        return;
      }
      if (!transactionScreenshot) {
        setErrors((prev) => ({
          ...prev,
          transactionScreenshot: "Transaction Screenshot is required.",
        }));
        setIsSubmitting(false);
        return;
      }
    }

    // Upload screenshot if provided
    let uploadedImageUrl = null;
    if (transactionScreenshot) {
      try {
        const imagePath = `images/${memberID}/${transactionScreenshot.name}`;
        const storageReference = storageRef(storage, imagePath);
        const snapshot = await uploadBytes(
          storageReference,
          transactionScreenshot
        );
        uploadedImageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading transaction screenshot:", error);
        setStatusMessage("Error uploading screenshot. Please try again.");
        return;
      }
    }

    // Update payment details in Firebase
    try {
      const paymentRef = ref(database, `users/${memberID}`);
      await update(paymentRef, {
        paymentMode,
        transactionReference,
        transactionScreenshot: uploadedImageUrl,
        amount: paymentData.amount,
        dateOfPayment: new Date().toISOString(),
      });

      setStatusMessage("Payment details submitted successfully!");
      //setTimeout(() => navigate("/success"), 3000); // Navigate to a success page
      navigate("/thank-you");
    } catch (error) {
      console.error("Error updating payment details:", error);
      setStatusMessage("Error submitting payment details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Payment Details</h2>

      <p>Member ID: {memberID}</p>
      <p>Membership Type: {membershipType}</p>
      <p>Please Pay: Rs.{paymentData.amount}</p>
      <label>
        Payment Mode:
        <select
          value={paymentData.paymentMode}
          onChange={handlePaymentModeChange}
        >
          <option value="">Select</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </label>
      {errors.paymentMode && (
        <span className="error">{errors.paymentMode}</span>
      )}
      <br />

      {paymentData.paymentMode === "Bank Transfer" && (
        <>
          <label>
            Transaction Reference Number:
            <input
              type="text"
              value={paymentData.transactionReference}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  transactionReference: e.target.value,
                }))
              }
            />
          </label>
          {errors.transactionReference && (
            <span className="error">{errors.transactionReference}</span>
          )}
          <br />
          <label>
            Upload Transaction Screenshot:
            <input
              type="file"
              accept="image/jpeg, image/jpg, image/png"
              onChange={handleFileSelect}
            />
          </label>
          {errors.transactionScreenshot && (
            <span className="error">{errors.transactionScreenshot}</span>
          )}
          <br />
        </>
      )}

      <p>
        <strong>Amount:</strong> ₹{paymentData.amount}
      </p>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Payment Details"}
      </button>
      {statusMessage && <p>{statusMessage}</p>}
    </form>
  );
};

PaymentDetails.propTypes = {
  memberID: PropTypes.string,
  membershipType: PropTypes.string,
};

export default PaymentDetails;
