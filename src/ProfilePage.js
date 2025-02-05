// src/ProfilePage.js
import React, { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!userData) {
    navigate("/welcome");
    return null;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Welcome, {userData.memberName}!</h2>
      <img
        src={userData.imageURL}
        alt="Profile"
        style={{ width: "150px", height: "150px", borderRadius: "50%" }}
      />
      <p>
        <strong>Email:</strong> {userData.email}
      </p>
      <p>
        <strong>Phone:</strong> {userData.mobile}
      </p>
      <p>
        <strong>Membership ID:</strong> {userData.membershipID}
      </p>
      <p>
        <strong>Membership Type:</strong> {userData.currentMembershipType}
      </p>
      <p>
        <strong>Address:</strong> {userData.addressLine1},{" "}
        {userData.addressLine2}, {userData.addressLine3}
      </p>
      <p>
        <strong>Blood Group:</strong> {userData.bloodGroup}
      </p>
      <p>
        <strong>Father/Guardian:</strong> {userData.fatherGuardianName}
      </p>
      <p>
        <strong>Gender:</strong> {userData.gender}
      </p>
      <p>
        <strong>Date of Birth:</strong> {userData.dob}
      </p>
      <p>
        <strong>Health History:</strong> {userData.illnessHistory}
      </p>
      <p>
        <strong>Hobbies:</strong> {userData.hobbies}
      </p>

      <h3>Payment History</h3>
      {userData.payments && userData.payments.length > 0 ? (
        <ul>
          {userData.payments.map((payment, index) => (
            <li key={index}>
              <strong>Amount:</strong> ₹{payment.amount} |
              <strong> Date:</strong>{" "}
              {new Date(payment.dateOfPayment).toLocaleDateString()} |
              <strong> Type:</strong> {payment.membershipType} |
              <strong> Mode:</strong> {payment.paymentMode} |
              <strong> Receipt:</strong> {payment.receiptNumber}
            </li>
          ))}
        </ul>
      ) : (
        <p>No payments found.</p>
      )}
    </div>
  );
};

export default ProfilePage;
