import React from "react";

const MembershipDetails = ({ formData, errors, handleChange }) => {
  return (
    <div>
      <label>Membership Type*:</label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="membershipType"
            value="Life"
            checked={formData.membershipType === "Life"}
            onChange={handleChange}
          />
          Life (Rs.2000 + charges)
        </label>
        <label>
          <input
            type="radio"
            name="membershipType"
            value="Annual"
            checked={formData.membershipType === "Annual"}
            onChange={handleChange}
          />
          Annual (Rs.250 + charges)
        </label>
      </div>
      <br />
      {/* <label>Payment Transaction Number:</label>
      <input
        type="text"
        name="paymentTransactionNumber"
        value={formData.paymentTransactionNumber}
        onChange={handleChange}
        pattern="[A-Za-z0-9]+" // Alphanumeric pattern        
      /> */}
      <div>
        <label>Recommended By:</label>
        <label>Name of the person recommending you:</label>
        <input
          type="text"
          name="recommendedByName"
          value={formData.recommendedByName}
          onChange={handleChange}
        />
        <label>KMA Member ID of the person recommending you:</label>
        <input
          type="text"
          name="recommendedByID"
          value={formData.recommendedByID}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default MembershipDetails;
