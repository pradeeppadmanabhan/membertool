import React from "react";
import PhoneNumberInput from "../utils/PhoneNumberInput";

const ContactInfo = ({ formData, errors, handleChange }) => {
  return (
    <div>
      <h3>Contact Information</h3>
      {/* Contact Info */}
      <label>Address Line1*:</label>
      <input
        type="text"
        name="addressLine1"
        value={formData.addressLine1}
        onChange={handleChange}
      />
      {errors.addressLine1 && (
        <span className="error">{errors.addressLine1}</span>
      )}
      <br />
      <label>Address Line2*:</label>
      <input
        type="text"
        name="addressLine2"
        value={formData.addressLine2}
        onChange={handleChange}
      />
      {errors.addressLine2 && (
        <span className="error">{errors.addressLine2}</span>
      )}
      <br />
      <label>Address Line3*:</label>
      <input
        type="text"
        name="addressLine3"
        value={formData.addressLine3}
        onChange={handleChange}
      />
      {errors.addressLine3 && (
        <span className="error">{errors.addressLine3}</span>
      )}
      <br />

      <br />
      <PhoneNumberInput
        name="mobile"
        value={formData.mobile}
        onChange={handleChange}
        error={errors.mobile}
        label="Mobile* (please provide a Whatsapp enabled number we can use for communication):"
      />

      <br />
      <label>E-mail ID* :</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        readOnly
        onChange={handleChange}
      />
      {errors.email && <span className="error">{errors.email}</span>}
      <br />
    </div>
  );
};

export default ContactInfo;
