import React from "react";

const MembershipDetails = ({ formData, errors, handleChange }) => {
  return (
    <div>
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
