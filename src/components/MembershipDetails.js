import React from "react";

const MembershipDetails = ({ formData, errors, handleChange }) => {
  return (
    <div>
      <div>
        <h3>Mountaineering Certifications</h3>
        <label>
          List any Mountaineering related Certifications you have obtained (if
          any)
        </label>
        <textarea
          name="mountaineeringCertifications"
          value={formData.mountaineeringCertifications}
          onChange={handleChange}
        />
      </div>
      <div>
        <h3>Membership Details</h3>
        <label>Recommended By: Name of the person recommending you:</label>
        <input
          type="text"
          name="recommendedByName"
          value={formData.recommendedByName}
          onChange={handleChange}
        />
        {/* <label>KMA Member ID of the person recommending you:</label>
        <input
          type="text"
          name="recommendedByID"
          value={formData.recommendedByID}
          onChange={handleChange}
        /> */}
      </div>
    </div>
  );
};

export default MembershipDetails;
