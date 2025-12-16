import React from "react";

const BackgroundHealth = ({ formData, errors, handleChange }) => {
  return (
    <div>
      <h3>General Background & Health Information</h3>
      <label>Academic Qualifications:</label>
      <textarea
        name="qualifications"
        value={formData.qualifications}
        onChange={handleChange}
      />
      <label>Profession:</label>
      <input
        type="text"
        name="profession"
        value={formData.profession}
        onChange={handleChange}
      />
      <label>Athletic Background, if any:</label>
      <textarea
        name="athleticBackground"
        value={formData.athleticBackground}
        onChange={handleChange}
      />
      <label>Experience in Trekking & Mountaineering, if any:</label>
      <textarea
        name="trekkingExperience"
        value={formData.trekkingExperience}
        onChange={handleChange}
      />
      <label>Hobbies:</label>
      <textarea
        name="hobbies"
        value={formData.hobbies}
        onChange={handleChange}
      />
      <label>History of serious illness/injury, if any*:</label>
      <textarea
        name="illnessHistory"
        value={formData.illnessHistory}
        onChange={handleChange}
      />
      {errors.illnessHistory && (
        <span className="error">{errors.illnessHistory}</span>
      )}
      <br />
      <label>Present General Health*:</label>
      <textarea
        name="generalHealth"
        value={formData.generalHealth}
        onChange={handleChange}
      />
      {errors.generalHealth && (
        <span className="error">{errors.generalHealth}</span>
      )}
      <br />
      <label>Blood Group*:(e.g., A+, O-)</label>
      <input
        type="text"
        name="bloodGroup"
        value={formData.bloodGroup}
        onChange={handleChange}
      />
      {errors.bloodGroup && <span className="error">{errors.bloodGroup}</span>}
      <br />
    </div>
  );
};

export default BackgroundHealth;
