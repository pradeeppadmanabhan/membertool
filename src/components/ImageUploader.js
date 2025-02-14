import React, { useState, useRef, useEffect } from "react";
import "../global.css";

const ImageUploader = ({ onImageSelect, selectedImage }) => {
  const [fileName, setFileName] = useState(""); // Store the file name for display
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (selectedImage) {
      setFileName(selectedImage.name);
    } else {
      setFileName("");
    }
  }, [selectedImage]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      onImageSelect(e.target.files[0]);
      setFileName(e.target.files[0].name); // Store the selected file name
    }
  };

  /* const resetUploader = () => {
    // New function to reset the uploader
    setFileName(""); // Clear the filename
    if (fileInputRef.current) {
      // Check if ref is attached
      fileInputRef.current.value = ""; // Clear the file input value
    }
    onImageSelect(null); // Reset selected image in parent
  }; */

  return (
    <div className="image-uploader">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageChange}
      />

      {/* Custom styled button to trigger file input */}
      <div className="button-group">
        {/* Add a container for the buttons */}
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="choose-file-btn"
        >
          Choose File
        </button>
        {/* Display selected file name */}
        {/* Placeholder for file-name */}
        <span className="file-name">
          {fileName ? fileName : "No file selected"}
        </span>
        {/* <button type="button" onClick={resetUploader} className="reset-btn">
          Clear Image
        </button> */}
      </div>
    </div>
  );
};

export default ImageUploader;
