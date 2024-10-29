import React from "react";

const PersonalInfo = ({ formData, errors, handleChange }) => {
  return (
    <div>
      <label>Applicant's Full Name*:</label>
      <input
        type="text"
        name="memberName"
        value={formData.memberName}
        onChange={handleChange}
      />
      {errors.memberName && <span className="error">{errors.memberName}</span>}
      <br />
      <label>Date of Birth*:</label>
      <input
        type="date"
        name="dob"
        value={formData.dob}
        onChange={handleChange}
      />
      {errors.dob && <span className="error">{errors.dob}</span>}
      <br />
      <label>Age*:</label>
      <input
        type="number"
        name="age"
        value={formData.age}
        onChange={handleChange}
      />
      {errors.age && <span className="error">{errors.age}</span>}
      <br />
      <label>Gender*:</label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="gender"
            value="Male"
            checked={formData.gender === "Male"}
            onChange={handleChange}
          />
          Male
        </label>
        <label>
          <input
            type="radio"
            name="gender"
            value="Female"
            checked={formData.gender === "Female"}
            onChange={handleChange}
          />
          Female
        </label>
      </div>
      {errors.gender && <span className="error">{errors.gender}</span>}
      <br />
      <label>Name of Father/Guardian/Husband*:</label>
      <input
        type="text"
        name="fatherGuardianName"
        value={formData.fatherGuardianName}
        onChange={handleChange}
      />
      {errors.fatherGuardianName && (
        <span className="error">{errors.fatherGuardianName}</span>
      )}
      <br />
    </div>
  );
};

export default PersonalInfo;
