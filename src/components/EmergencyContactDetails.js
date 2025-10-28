import React from "react";
import PhoneNumberInput from "../utils/PhoneNumberInput";

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

      <PhoneNumberInput
        name="emergencyContactPhone"
        value={formData.emergencyContactPhone}
        onChange={handleChange}
        error={errors.emergencyContactPhone}
        label="Contact Phone Number*"
      />
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
