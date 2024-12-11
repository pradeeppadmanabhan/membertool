// src/components/PaymentDetails.js
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { ref, get, update, runTransaction } from "firebase/database";
import { database, storage } from "../firebase";
import "../global.css";
import ImageUploader from "./ImageUploader";
import { useLocation } from "react-router-dom";

const PaymentDetails = () => {
  // Access data passed from MembershipApplicationForm
  const { memberID, membershipType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [memberData, setMemberData] = useState(location.state?.memberData);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const ANNUAL_MEMBERSHIP_FEE = 250;
  const LIFE_MEMBERSHIP_FEE = 2000;

  const [paymentData, setPaymentData] = useState({
    paymentMode: "",
    transactionReference: "",
    transactionScreenshot: null,
    amount:
      membershipType === "Annual"
        ? ANNUAL_MEMBERSHIP_FEE
        : membershipType === "Life"
          ? LIFE_MEMBERSHIP_FEE
          : 0,
  });
  const [loadingError, setLoadingError] = useState(null);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch data when the component mounts
    const fetchMemberData = async () => {
      try {
        //console.log("Fetching member data for ", memberID);
        const memberRef = ref(database, `users/${memberID}`);
        const snapshot = await get(memberRef);
        if (snapshot.exists()) {
          const memberData = snapshot.val();
          //console.log("Fetched member data:", memberData);
          setMemberData(memberData);
          //console.log("Member data fetched successfully:", snapshot.val());
          setPayments(memberData.payments || []);
        } else {
          // Handle case where member data is not found
          console.error("Member data not found for ID:", memberID);
          // Consider setting an error state or redirecting
          setLoadingError("Error: Member data not found");
        }
      } catch (error) {
        console.error("Error fetching member data:", error);
        // Handle error appropriately
        setLoadingError("Error fetching member data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (memberID) {
      // Only fetch if memberID is available
      fetchMemberData();
    }
  }, [memberID]); // Run the effect whenever memberID changes

  if (isLoading) {
    return <p>Loading member data...</p>;
  }

  if (loadingError) {
    return <p className="error">{loadingError}</p>;
  }

  //console.log("memberId:", memberID, "membershipType:", membershipType);
  if (!memberID || !membershipType) {
    return (
      <div>
        Error: Invalid URL. Please provide valid member ID and membership type.
      </div>
    );
  }
  if (!memberData) {
    //Conditional rendering before fetching data
    return (
      <p> Please wait while we get the information to make your payment </p>
    );
  }

  async function generateReceiptNumber(database) {
    const receiptCounterRef = ref(database, "counters/receipt_counter");

    let receiptNumber = "";
    try {
      const result = await runTransaction(receiptCounterRef, (currentCount) => {
        if (currentCount === null) {
          currentCount = 1;
        }
        if (typeof currentCount !== "number") {
          currentCount = parseInt(currentCount, 10);
        }
        const nextCount = currentCount + 1;
        return nextCount;
      });

      if (result.committed) {
        receiptNumber = "D" + String(result.snapshot.val()).padStart(5, "0");
        //console.log("Receipt Number Generated:", receiptNumber);
      } else {
        console.error("Transaction not committed", result.error);
        throw result.error;
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
    return receiptNumber;
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

  const handleFileSelect = (file) => {
    //const file = e.target.files[0];
    setPaymentData((prev) => ({ ...prev, transactionScreenshot: file }));
    //console.log("file :", file);
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

    const isDuplicatePayment = payments.some(
      (payment) =>
        payment.paymentMode === paymentMode &&
        payment.transactionReference === transactionReference
    );

    if (isDuplicatePayment) {
      setErrors((prev) => ({
        ...prev,
        transactionReference: "This transaction has already been recorded",
      }));
      setIsSubmitting(false);
      return;
    }

    // Upload screenshot if provided
    let uploadedScreenshotURL = null;
    if (transactionScreenshot) {
      try {
        const imagePath = `images/${memberID}/${transactionScreenshot.name}`;
        const storageReference = storageRef(storage, imagePath);
        const snapshot = await uploadBytes(
          storageReference,
          transactionScreenshot
        );
        uploadedScreenshotURL = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading transaction screenshot:", error);
        setStatusMessage("Error uploading screenshot. Please try again.");
        return;
      }
    }

    const receiptNumber = await generateReceiptNumber(database);

    // Update payment details in Firebase
    try {
      const paymentRecord = {
        paymentMode,
        transactionReference,
        transactionScreenshot: uploadedScreenshotURL,
        amount: paymentData.amount,
        receiptNo: receiptNumber,
        dateOfPayment: new Date().toISOString(),
        applicationStatus: "Paid",
        membershipType: membershipType,
      };

      const paymentRef = ref(database, `users/${memberID}/payments/`);
      const newPaymentIndex = payments.length;
      await update(paymentRef, {
        [newPaymentIndex]: paymentRecord,
      });

      setStatusMessage("Payment details submitted successfully!");
      navigate(`/thank-you/${receiptNumber}/${memberID}`, {
        state: { memberData },
      });
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

      <p>
        Member ID: <b>{memberData?.id}</b>
      </p>
      <p>Membership Type: {memberData?.membershipType}</p>
      <p>Please Pay: Rs.{paymentData.amount}</p>
      <label>
        Payment Mode:
        <select
          className="filter-select"
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

      {paymentData.paymentMode === "Cash" && (
        <>
          <p> Please pay cash to the treasurer and get a receipt. </p>
        </>
      )}
      {paymentData.paymentMode === "Bank Transfer" && (
        <>
          <p>
            Please make a bank transfer to the following Account and share
            details:
            <br />
            <br />
            <b>The Karnataka Mountaineering Association</b>
            <br />
            Account No 520101235072644
            <br />
            Union Bank of India, Nrupatunga Road Branch, Bengaluru
            <br />
            IFSC / NEFT – UBIN0901750
            <br />
          </p>
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
            <ImageUploader
              onImageSelect={handleFileSelect}
              selectedImage={paymentData.transactionScreenshot}
            />
          </label>
          {errors.transactionScreenshot && (
            <span className="error">{errors.transactionScreenshot}</span>
          )}
          <br />
        </>
      )}

      {/* <p>
        <strong>Amount:</strong> ₹{paymentData.amount}
      </p> */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Payment Details"}
      </button>
      {statusMessage && <p>{statusMessage}</p>}
      {errors.transactionReference && (
        <span className="error">{errors.transactionReference}</span>
      )}
      <br />
      {/* {payments.length > 0 && (
        <div>
          <h3>Past Payments</h3>
          <table>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.receiptNo}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.paymentMode}</td>
                  <td>
                    {new Date(payment.dateOfPayment).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )} */}
    </form>
  );
};

PaymentDetails.propTypes = {
  memberID: PropTypes.string,
  membershipType: PropTypes.string,
};

export default PaymentDetails;
