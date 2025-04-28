import React from "react";

const EmergencyContactDetails = ({ formData, errors, handleChange }) => {
  return (
    <div>
      <h3>Emergency Contact Details</h3>
      <label>Contact Name*</label>
      <input
        type="text"
        name="emergencyContactName"
        value={formData.emergencyContactName}
        onChange={handleChange}
      />
      {errors.emergencyContactName && (
        <span className="error">{errors.emergencyContactName}</span>
      )}
      <br />

      <label>Contact Phone Number*</label>
      <input
        type="text"
        name="emergencyContactPhone"
        value={formData.emergencyContactPhone}
        onChange={handleChange}
      />
      {errors.emergencyContactPhone && (
        <span className="error">{errors.emergencyContactPhone}</span>
      )}
      <br />

      <label>Contact Email*</label>
      <input
        type="email"
        name="emergencyContactEmail"
        value={formData.emergencyContactEmail}
        onChange={handleChange}
      />
      {errors.emergencyContactEmail && (
        <span className="error">{errors.emergencyContactEmail}</span>
      )}
      <br />

      <label>Relationship to Applicant*</label>
      <input
        type="text"
        name="emergencyContactRelationship"
        value={formData.emergencyContactRelationship}
        onChange={handleChange}
      />
      {errors.emergencyContactRelationship && (
        <span className="error">{errors.emergencyContactRelationship}</span>
      )}
      <br />
    </div>
  );
};

export default EmergencyContactDetails;
