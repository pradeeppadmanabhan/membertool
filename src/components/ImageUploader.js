import React, { useState, useRef, useEffect } from "react";
import "../global.css";

const ImageUploader = ({ onImageSelect }) => {
  const [fileName, setFileName] = useState(""); // Store the file name for display
  const [previewURL, setPreviewURL] = useState(null); // Store the preview URL
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);

      if (onImageSelect) {
        onImageSelect(file);
      } else {
        console.warn("onImageSelect prop is not provided.");
      }
    } else {
      setFileName("");
      setPreviewURL(null);
    }
  };

  useEffect(() => {
    // Clean up the object URL when the component unmounts or the image changes
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

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
        <span className="file-name">
          {fileName ? fileName : "No file selected"}
        </span>
      </div>

      {/* Image Preview */}
      {previewURL && (
        <div className="image-preview">
          <img src={previewURL} alt="Preview" className="preview-image" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
