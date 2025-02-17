import React, { useState, useEffect } from "react";
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

const UserProfile = ({ memberID }) => {
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      console.log("memberID:", memberID);
      if (memberID) {
        const freshData = await fetchMemberData(memberID);
        setFormData(freshData);
        //console.log("Loaded data:", freshData);
      }
    };
    loadData();
  }, [memberID, formData.imageURL]);

  if (!formData) {
    return <div>Loading user details...</div>;
  }

  // ✅ Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // ✅ Save updates to Firebase
  const handleSave = async () => {
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
      setStatusMessage("Error updating profile. Please try again.");
    }
  };

  const isLifeMember = formData.currentMembershipType === "Life";
  const currentDate = new Date();
  const renewalDate = new Date(formData.renewalDueOn);
  const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000; // 1 month in milliseconds

  const isRenewalDue =
    renewalDate.getTime() - oneMonthInMillis <= currentDate.getTime() &&
    currentDate.getTime() <= renewalDate.getTime() + oneMonthInMillis;

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

  // Calculate if user is eligible for upgrade
  const submissionDate = new Date(formData.dateOfSubmission);
  const twoYearsLater = new Date(submissionDate);
  twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

  const canUpgradeToLife = !isLifeMember && currentDate >= twoYearsLater;

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
          <label>Upload Passport Size Photo</label>
          <ImageUploader
            onImageSelect={setSelectedImage}
            selectedImage={selectedImage}
          />
        </>
      ) : (
        formData.imageURL && (
          <img
            className="profile-image"
            src={formData.imageURL}
            alt="Profile"
          />
        )
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
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                />
              ) : (
                formData.mobile
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Membership ID:</strong>
            </td>
            <td>{formData.id}</td>
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
                  {new Date(formData.renewalDueOn).toLocaleDateString()}
                  {canUpgradeToLife && (
                    <button
                      className="upgrade-button"
                      onClick={handleUpgradeToLife}
                    >
                      {`Upgrade to Life - ₹${LIFE_MEMBERSHIP_FEE}`}
                    </button>
                  )}
                  {isRenewalDue && (
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
                <input
                  type="text"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                />
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
                <input
                  type="text"
                  name="fatherGuardianName"
                  value={formData.fatherGuardianName}
                  onChange={handleChange}
                />
              ) : (
                formData.fatherGuardianName
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Gender:</strong>
            </td>
            <td>{formData.gender}</td>
          </tr>
          <tr>
            <td>
              <strong>Date of Birth:</strong>
            </td>
            <td>{formData.dob}</td>
          </tr>
          <tr>
            <td>
              <strong>Academic Qualification: </strong>
            </td>
            <td>
              {isEditing ? (
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                />
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
                <textarea
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                />
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
                <textarea
                  name="athleticBackground"
                  value={formData.athleticBackground}
                  onChange={handleChange}
                />
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
                <textarea
                  name="trekkingExperience"
                  value={formData.trekkingExperience}
                  onChange={handleChange}
                />
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
                <textarea
                  name="illnessHistory"
                  value={formData.illnessHistory}
                  onChange={handleChange}
                />
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
                <textarea
                  name="generalHealth"
                  value={formData.generalHealth}
                  onChange={handleChange}
                />
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
                <textarea
                  name="hobbies"
                  value={formData.hobbies}
                  onChange={handleChange}
                />
              ) : (
                formData.hobbies
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Recommended By:</strong>
            </td>
            <td>
              {isEditing ? (
                <textarea
                  name="recommendedByName"
                  value={formData.recommendedByName}
                  onChange={handleChange}
                />
              ) : (
                formData.recommendedByName
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
            Edit
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
            </tr>
          </thead>
          <tbody>
            {formData.payments.map((payment, index) => (
              <tr key={index}>
                <td>₹{payment.amount}</td>
                <td>{new Date(payment.dateOfPayment).toLocaleDateString()}</td>
                <td>{payment.membershipType}</td>
                <td>{payment.paymentMode}</td>
                <td>{payment.receiptNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No payments found.</p>
      )}
    </div>
  );
};

export default UserProfile;
