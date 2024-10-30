import React from "react";

const ContactInfo = ({ formData, errors, handleChange }) => {
  return (
    <div>
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
      <label>Landline:</label>
      <input
        type="text"
        name="landline"
        value={formData.landline}
        onChange={handleChange}
      />
      {errors.landline && <span className="error">{errors.landline}</span>}
      <br />
      <label>Mobile*:</label>
      <input
        type="text"
        name="mobile"
        value={formData.mobile}
        onChange={handleChange}
      />
      {errors.mobile && <span className="error">{errors.mobile}</span>}
      <br />
      <label>E-mail ID*:</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      {errors.email && <span className="error">{errors.email}</span>}
      <br />
    </div>
  );
};

export default ContactInfo;
