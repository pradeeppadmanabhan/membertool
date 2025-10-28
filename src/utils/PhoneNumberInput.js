import React from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

const PhoneNumberInput = ({ name, value, onChange, error, label }) => {
  const handlePhoneChange = (phoneValue) => {
    onChange({ target: { name, value: phoneValue } });
  };

  return (
    <div>
      <label>{label}</label>
      <PhoneInput
        defaultCountry="IN" // Set India as the default country
        value={value}
        onChange={handlePhoneChange}
        placeholder="Enter phone number"
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
};

export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return "Phone number is required.";
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return "Invalid phone number.";
  }

  return null;
};

export default PhoneNumberInput;
