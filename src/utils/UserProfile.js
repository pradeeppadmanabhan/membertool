import React, { useState, useEffect, useContext } from "react";
import { database, storage } from "../firebase";
import { ref, update } from "firebase/database";
import PrintApplication from "../utils/PrintApplication";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import ImageUploader from "../components/ImageUploader";
import {
  ANNUAL_MEMBERSHIP_FEE,
  LIFE_MEMBERSHIP_FEE,
  handleRazorpayPayment,
  fetchMemberData,
} from "../utils/PaymentUtils";
import { useNavigate } from "react-router-dom";
import "../global.css"; // ✅ Ensures consistent styling
import AuthContext from "../AuthContext";
import { isEligibleForLifeMembership } from "./EligibilityUtils";
import PhoneNumberInput from "../utils/PhoneNumberInput";

const UserProfile = ({ memberID }) => {
  const { isAdmin } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [errors, setErrors] = useState({}); // State to hold validation errors
  const navigate = useNavigate();
  const [newPayment, setNewPayment] = useState({
    amount: ANNUAL_MEMBERSHIP_FEE, // Default to Annual Membership Fee
    membershipType: "Annual", // Default to Annual Membership
    dateOfPayment: "",
    paymentMode: "",
    receiptNumber: "",
    paymentID: "",
    orderID: "",
  });

  useEffect(() => {
    const loadData = async () => {
      console.log("memberID:", memberID);
      if (memberID) {
        const freshData = await fetchMemberData(memberID);
        setFormData(freshData);
        console.log("Loaded data:", freshData);
      } else {
        setFormData({});
      }
    };
    loadData();
  }, [memberID, formData?.imageURL]);

  if (!formData || Object.keys(formData).length === 0) {
    return <div>Loading user details...</div>;
  }

  const handleAddPayment = async () => {
    if (
      !newPayment.dateOfPayment ||
      !newPayment.paymentMode ||
      !newPayment.receiptNumber ||
      !newPayment.membershipType ||
      (newPayment.paymentMode === "Razorpay" &&
        (!newPayment.paymentID || !newPayment.orderID))
    ) {
      setStatusMessage("Please fill in all required payment details.");
      return;
    }

    try {
      const paymentRecord = {
        paymentMode: newPayment.paymentMode,
        amount:
          newPayment.membershipType === "Annual"
            ? ANNUAL_MEMBERSHIP_FEE
            : LIFE_MEMBERSHIP_FEE,
        receiptNumber: newPayment.receiptNumber,
        membershipType: newPayment.membershipType,
        dateOfPayment: newPayment.dateOfPayment,
        applicationStatus: "Paid",
        ...(newPayment.paymentMode === "Razorpay" && {
          paymentID: newPayment.paymentID,
          orderID: newPayment.orderID,
        }), // Add Razorpay-specific fields
      };

      const memberData = await fetchMemberData(memberID); // Fetch existing member data
      const updatedPayments = [...(memberData.payments || []), paymentRecord];

      // ✅ Convert array to object using reduce (from PaymentUtils.js)
      const paymentsObject = updatedPayments.reduce((acc, item, index) => {
        acc[index] = item;
        return acc;
      }, {});

      const paymentRef = ref(database, `users/${memberID}/payments`);
      await update(paymentRef, paymentsObject); // Update payments in Firebase

      // Update membership details
      const updatedMemberData = { ...memberData };
      if (newPayment.membershipType === "Life") {
        updatedMemberData.renewalDueOn = null;
        updatedMemberData.currentMembershipType = "Life";
      } else if (newPayment.membershipType === "Annual") {
        const now = new Date();
        const nextYear = memberData.renewalDueOn
          ? new Date(memberData.renewalDueOn)
          : now;
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        updatedMemberData.renewalDueOn = nextYear.toISOString();
        updatedMemberData.currentMembershipType = "Annual";
      }
      updatedMemberData.applicationStatus = "Paid";

      const memberRef = ref(database, `users/${memberID}`);
      await update(memberRef, {
        renewalDueOn: updatedMemberData.renewalDueOn,
        currentMembershipType: updatedMemberData.currentMembershipType,
        applicationStatus: updatedMemberData.applicationStatus,
      });

      // ✅ Fetch updated payments from the database
      const refreshedMemberData = await fetchMemberData(memberID);
      setFormData(refreshedMemberData); // Update local state with refreshed data

      setNewPayment({
        paymentMode: "",
        receiptNumber: "",
        dateOfPayment: "",
        membershipType: "",
        paymentID: "",
        orderID: "",
      });

      setStatusMessage("Payment added successfully!");
    } catch (error) {
      console.error("Error adding payment:", error);
      setStatusMessage("Error adding payment. Please try again.");
    }
  };

  //Handle form Validation
  const validateField = (name, value) => {
    switch (name) {
      case "dob":
        const date = new Date(value);
        if (!value || isNaN(date.getTime()) || date > new Date()) {
          return "Must be a valid date and not in the future.";
        }
        break;

      case "addressLine1":
      case "addressLine2":
      case "addressLine3":
      case "fatherGuardianName":
      case "recommendedByName":
      case "emergencyContactName":
      case "emergencyContactRelationship":
        if (value.length > 50) {
          return "Must not exceed 50 characters.";
        }
        break;

      case "bloodGroup":
        if (!/^(A|B|AB|O)[+-]$/.test(value)) {
          return "Must be a valid blood group (e.g., A+, O-).";
        }
        break;

      case "gender":
        if (!["Male", "Female", "Other"].includes(value)) {
          return "Must be Male, Female, or Other.";
        }
        break;

      case "qualifications":
      case "profession":
      case "athleticBackground":
      case "trekkingExperience":
      case "illnessHistory":
      case "generalHealth":
      case "hobbies":
      case "mountaineeringCertifications":
        if (value.length > 500) {
          return "Must not exceed 500 characters.";
        }
        break;

      case "emergencyContactEmail":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Must be a valid email address.";
        }
        break;

      default:
        break;
    }
    return null; // No validation error
  };

  // ✅ Handle form input changes
  const handleChange = (e) => {
    const { name, value, error } = e.target;

    // Validate the field
    //const error = validateField(name, value);
    if (error) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    } else {
      setErrors((prevErrors) => {
        const { [name]: removedError, ...rest } = prevErrors;
        return rest;
      });
    }

    // Update form data
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // ✅ Save updates to Firebase
  const handleSave = async () => {
    // Validate all fields before saving
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatusMessage("Please fix validation errors before saving.");
      return;
    }

    try {
      const userRef = ref(database, `users/${formData.id}`);
      let updatedImageUrl = formData.imageURL;

      if (selectedImage) {
        const imagePath = `images/${formData.id}/${selectedImage.name}`;
        const storageReference = storageRef(storage, imagePath);
        const snapshot = await uploadBytes(storageReference, selectedImage);
        updatedImageUrl = await getDownloadURL(snapshot.ref);
      }

      await update(userRef, { ...formData, imageURL: updatedImageUrl });
      setFormData((prevData) => ({ ...prevData, imageURL: updatedImageUrl }));
      setIsEditing(false);
      setStatusMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setStatusMessage("Error updating profile. Please try again.", error);
    }
  };

  const isLifeMember = formData.currentMembershipType === "Life";

  const handleRenewal = () => {
    handleRazorpayPayment(
      formData.id,
      ANNUAL_MEMBERSHIP_FEE,
      formData.currentMembershipType,
      navigate,
      setStatusMessage
    );
  };

  const handleUpgradeToLife = () => {
    handleRazorpayPayment(
      formData.id,
      LIFE_MEMBERSHIP_FEE,
      "Life",
      navigate,
      setStatusMessage
    );
  };

  const handlePaymentFieldChange = (field, value) => {
    setNewPayment((prevPayment) => ({
      ...prevPayment,
      [field]: value,
      ...(field === "membershipType" && {
        amount:
          value === "Annual"
            ? ANNUAL_MEMBERSHIP_FEE
            : value === "Life"
              ? LIFE_MEMBERSHIP_FEE
              : 0, // Automatically set amount based on selected membership type
      }),
    }));
  };

  // Calculate if user is eligible for upgrade
  const submissionDate =
    formData.dateOfSubmission &&
    !isNaN(new Date(formData.dateOfSubmission).getTime())
      ? new Date(formData.dateOfSubmission)
      : null;

  const canUpgradeToLife =
    !isLifeMember && isEligibleForLifeMembership(submissionDate);

  const handlePrintApplication = () => {
    if (formData) {
      PrintApplication(formData);
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-heading">Welcome, {formData.memberName}!</h2>

      {isEditing ? (
        <>
          <label>Upload Profile Pic</label>
          <ImageUploader
            onImageSelect={setSelectedImage}
            selectedImage={selectedImage}
          />
        </>
      ) : formData?.imageURL ? (
        <img className="profile-image" src={formData.imageURL} alt="Profile" />
      ) : (
        <div className="profile-image placeholder)">
          Edit to add your Profile Pic
        </div>
      )}

      {/* ✅ Status Message */}
      {statusMessage && <p className="status-message">{statusMessage}</p>}

      <table className="profile-table">
        <tbody>
          <tr>
            <td className="field-name">
              <strong>Email:</strong>
            </td>
            <td>{formData.email}</td>
          </tr>
          <tr>
            <td>
              <strong>Mobile:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <PhoneNumberInput
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    error={errors.mobile}
                    label="Mobile Number"
                  />
                </>
              ) : (
                formData.mobile
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Membership ID:</strong>
            </td>
            <td>
              {formData.id}{" "}
              {formData.applicationStatus === "Submitted"
                ? "(Pending: Please fill details and make payment to complete profile)"
                : ""}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Membership Type:</strong>
            </td>
            <td>{formData.currentMembershipType}</td>
          </tr>
          <tr>
            <td>
              <strong>Renewal Due on:</strong>
            </td>
            <td className="renewal-container">
              {isLifeMember ? (
                "Life Time Validity"
              ) : (
                <>
                  {formData.renewalDueOn &&
                  !isNaN(new Date(formData.renewalDueOn).getTime())
                    ? new Date(formData.renewalDueOn).toLocaleDateString()
                    : "N/A"}
                  {canUpgradeToLife && (
                    <button
                      className="upgrade-button"
                      onClick={handleUpgradeToLife}
                    >
                      {`Upgrade to Life - ₹${LIFE_MEMBERSHIP_FEE}`}
                    </button>
                  )}
                  {formData.applicationStatus === "Due" && (
                    <button className="renew-button" onClick={handleRenewal}>
                      {`Annual Renewal - ₹${ANNUAL_MEMBERSHIP_FEE}`}
                    </button>
                  )}
                </>
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Address:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="addressLine3"
                    value={formData.addressLine3}
                    onChange={handleChange}
                  />
                  {errors.addressLine1 && (
                    <p className="error-message">{errors.addressLine1}</p>
                  )}
                  {errors.addressLine2 && (
                    <p className="error-message">{errors.addressLine2}</p>
                  )}
                  {errors.addressLine3 && (
                    <p className="error-message">{errors.addressLine3}</p>
                  )}
                </>
              ) : (
                `${formData.addressLine1}, ${formData.addressLine2}, ${formData.addressLine3}`
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Blood Group:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  />
                  {errors.bloodGroup && (
                    <p className="error-message">{errors.bloodGroup}</p>
                  )}
                </>
              ) : (
                formData.bloodGroup
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Father/Guardian:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="fatherGuardianName"
                    value={formData.fatherGuardianName}
                    onChange={handleChange}
                  />
                  {errors.fatherGuardianName && (
                    <p className="error-message">{errors.fatherGuardianName}</p>
                  )}
                </>
              ) : (
                formData.fatherGuardianName
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Gender:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  />
                  {errors.gender && (
                    <p className="error-message">{errors.gender}</p>
                  )}
                </>
              ) : (
                formData.gender
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Date of Birth:</strong>
            </td>
            <td>
              {
                isEditing ? (
                  <>
                    <input
                      type="date"
                      name="dob"
                      value={
                        formData.dob && !isNaN(new Date(formData.dob).getTime())
                          ? new Date(formData.dob).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                    />
                    {errors.dob && (
                      <p className="error-message">{errors.dob}</p>
                    )}
                  </>
                ) : formData.dob && !isNaN(new Date(formData.dob).getTime()) ? (
                  new Date(formData.dob).toLocaleDateString()
                ) : (
                  "dd/mm/yyyy"
                ) // Placeholder for empty date
              }
            </td>
          </tr>
          <tr>
            <td>
              <strong>Academic Qualification: </strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                  />
                  {errors.qualifications && (
                    <p className="error-message">{errors.qualifications}</p>
                  )}
                </>
              ) : (
                formData.qualifications
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Profession:</strong>
            </td>

            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                  />
                  {errors.profession && (
                    <p className="error-message">{errors.profession}</p>
                  )}
                </>
              ) : (
                formData.profession
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Athletic Background:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="athleticBackground"
                    value={formData.athleticBackground}
                    onChange={handleChange}
                  />
                  {errors.athleticBackground && (
                    <p className="error-message">{errors.athleticBackground}</p>
                  )}
                </>
              ) : (
                formData.athleticBackground
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Trekking Experience:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="trekkingExperience"
                    value={formData.trekkingExperience}
                    onChange={handleChange}
                  />
                  {errors.trekkingExperience && (
                    <p className="error-message">{errors.trekkingExperience}</p>
                  )}
                </>
              ) : (
                formData.trekkingExperience
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Illness History:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="illnessHistory"
                    value={formData.illnessHistory}
                    onChange={handleChange}
                  />
                  {errors.illnessHistory && (
                    <p className="error-message">{errors.illnessHistory}</p>
                  )}
                </>
              ) : (
                formData.illnessHistory
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Present Health:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="generalHealth"
                    value={formData.generalHealth}
                    onChange={handleChange}
                  />
                  {errors.generalHealth && (
                    <p className="error-message">{errors.generalHealth}</p>
                  )}
                </>
              ) : (
                formData.generalHealth
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Hobbies:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="hobbies"
                    value={formData.hobbies}
                    onChange={handleChange}
                  />
                  {errors.hobbies && (
                    <p className="error-message">{errors.hobbies}</p>
                  )}
                </>
              ) : (
                formData.hobbies
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Mountaineering Certifications:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="mountaineeringCertifications"
                    value={formData.mountaineeringCertifications}
                    onChange={handleChange}
                  />
                  {errors.mountaineeringCertifications && (
                    <p className="error-message">
                      {errors.mountaineeringCertifications}
                    </p>
                  )}
                </>
              ) : (
                formData.mountaineeringCertifications
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Recommended By:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="recommendedByName"
                    value={formData.recommendedByName}
                    onChange={handleChange}
                  />
                  {errors.recommendedByName && (
                    <p className="error-message">{errors.recommendedByName}</p>
                  )}
                </>
              ) : (
                formData.recommendedByName
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="profile-table">
        <tbody>
          <tr>
            <td className="field-name">
              <strong>Emergency Contact Name:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                  />
                  {errors.emergencyContactName && (
                    <p className="error-message">
                      {errors.emergencyContactName}
                    </p>
                  )}
                </>
              ) : (
                formData.emergencyContactName
              )}
            </td>
          </tr>
          <tr>
            <td className="field-name">
              <strong>Emergency Contact Phone:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <PhoneNumberInput
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    error={errors.emergencyContactPhone}
                    label="Emergency Contact Phone"
                  />
                </>
              ) : (
                formData.emergencyContactPhone
              )}
            </td>
          </tr>
          <tr>
            <td className="field-name">
              <strong>Emergency Contact Email:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="emergencyContactEmail"
                    value={formData.emergencyContactEmail}
                    onChange={handleChange}
                  />
                  {errors.emergencyContactEmail && (
                    <p className="error-message">
                      {errors.emergencyContactEmail}
                    </p>
                  )}
                </>
              ) : (
                formData.emergencyContactEmail
              )}
            </td>
          </tr>
          <tr>
            <td className="field-name">
              <strong>Emergency Contact Relationship:</strong>
            </td>
            <td>
              {isEditing ? (
                <>
                  <textarea
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleChange}
                  />
                  {errors.emergencyContactRelationship && (
                    <p className="error-message">
                      {errors.emergencyContactRelationship}
                    </p>
                  )}
                </>
              ) : (
                formData.emergencyContactRelationship
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ✅ Edit & Save Buttons */}
      <div className="button-container">
        {isEditing ? (
          <>
            <button className="save-button" onClick={handleSave}>
              Save
            </button>
            <button
              className="cancel-button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="button-container">
        <button onClick={handlePrintApplication}>Download Application</button>
      </div>

      <h3 className="profile-heading">Payment History</h3>

      {formData.payments && formData.payments.length > 0 ? (
        <table className="profile-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Date</th>
              <th>Membership Type</th>
              <th>Mode</th>
              <th>Receipt</th>
              {/*{isAdmin && <th>Actions</th>}  Admin-only actions */}
            </tr>
          </thead>
          <tbody>
            {formData.payments.map((payment, index) => (
              <tr key={index}>
                <td>₹{payment.amount}</td>
                <td>
                  {payment.dateOfPayment &&
                  !isNaN(new Date(payment.dateOfPayment).getTime())
                    ? new Date(payment.dateOfPayment).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>{payment.membershipType}</td>
                <td>{payment.paymentMode}</td>
                <td>{payment.receiptNumber}</td>
                {/*{isAdmin && (
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => {
                        console.log("Edit payment:", payment);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => {
                        console.log("Delete payment:", payment);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                )}{" "}
                 Admin-only actions */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          <p>No payments found.</p>
          <button className="renew-button" onClick={handleRenewal}>
            {`Annual Due - ₹${ANNUAL_MEMBERSHIP_FEE}`}
          </button>
        </div>
      )}

      {/* Admin Add Payment Section */}
      {isAdmin && (
        <div className="add-payment-container">
          <h4>Add Payment Details</h4>
          <div className="payment-fields-row">
            <select
              value={newPayment.paymentMode}
              onChange={(e) =>
                handlePaymentFieldChange("paymentMode", e.target.value)
              }
              className="filter-select"
            >
              <option value="">Select Payment Mode</option>
              <option value="Cash">Cash</option>
              <option value="Razorpay">Razorpay</option>
            </select>
            <input
              type="date"
              placeholder="Date of Payment"
              value={
                newPayment.dateOfPayment &&
                !isNaN(new Date(newPayment.dateOfPayment).getTime())
                  ? newPayment.dateOfPayment
                  : ""
              }
              onChange={(e) =>
                handlePaymentFieldChange("dateOfPayment", e.target.value)
              }
              className="input"
            />

            <select
              value={newPayment.membershipType}
              onChange={(e) =>
                handlePaymentFieldChange("membershipType", e.target.value)
              }
              className="filter-select"
            >
              <option value="">Select Membership Type</option>
              <option value="Annual">Annual</option>
              <option value="Life">Life</option>
            </select>

            {/* Display-only Amount */}
            <div className="amount-display">
              Fees Paid: ₹{newPayment.amount || 0}{" "}
              {/* Display the calculated amount */}
            </div>

            <input
              type="text"
              placeholder="Receipt Number"
              value={newPayment.receiptNumber}
              onChange={(e) =>
                handlePaymentFieldChange("receiptNumber", e.target.value)
              }
              className="input"
            />
            {newPayment.paymentMode === "Razorpay" && (
              <>
                <input
                  type="text"
                  placeholder="Payment ID"
                  value={newPayment.paymentID}
                  onChange={(e) =>
                    handlePaymentFieldChange("paymentID", e.target.value)
                  }
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Order ID"
                  value={newPayment.orderID}
                  onChange={(e) =>
                    handlePaymentFieldChange("orderID", e.target.value)
                  }
                  className="input"
                />
              </>
            )}
          </div>
          <div className="button-container">
            <button className="add-button" onClick={handleAddPayment}>
              Add Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
