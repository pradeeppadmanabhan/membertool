import React, { useState, useRef, useEffect } from "react";
import "../global.css";
import {
  compressImage,
  //formatFileSize,
  validateCompressedSize,
} from "../utils/ImageCompressionUtils";

const ImageUploader = ({ onImageSelect }) => {
  const [fileName, setFileName] = useState(""); // Store the file name for display
  const [previewURL, setPreviewURL] = useState(null); // Store the preview URL
  const [compressionInfo, setCompressionInfo] = useState(null); // Store compression details
  const [isCompressing, setIsCompressing] = useState(false); // Track compression state
  const [compressionError, setCompressionError] = useState(null); // Store compression errors
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setIsCompressing(true);
      setCompressionError(null);

      try {
        // Compress the image
        const compressionResult = await compressImage(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.75,
          format: "webp",
        });

        // Validate compressed size
        const maxSizeBytes = 1 * 1024 * 1024; // 1MB
        const sizeValidation = validateCompressedSize(
          compressionResult.file.size,
          maxSizeBytes,
        );

        if (!sizeValidation.isValid) {
          setCompressionError(sizeValidation.message);
          setFileName("");
          setPreviewURL(null);
          setCompressionInfo(null);
          setIsCompressing(false);
          return;
        }

        // Set file name and preview from compressed image
        setFileName(file.name); // Use original file name for display
        const url = URL.createObjectURL(compressionResult.file);
        setPreviewURL(url);

        // Store compression info for display
        setCompressionInfo(compressionResult);

        // Pass compressed file to parent component
        if (onImageSelect) {
          onImageSelect(compressionResult.file);
        } else {
          console.warn("onImageSelect prop is not provided.");
        }
      } catch (error) {
        console.error("Image compression failed:", error);
        setCompressionError(
          error.message || "Failed to process image. Please try another image.",
        );
        setFileName("");
        setPreviewURL(null);
        setCompressionInfo(null);
      } finally {
        setIsCompressing(false);
      }
    } else {
      setFileName("");
      setPreviewURL(null);
      setCompressionInfo(null);
      setCompressionError(null);
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
          disabled={isCompressing}
        >
          {isCompressing ? "Processing..." : "Choose File"}
        </button>
        <span className="file-name">
          {fileName ? fileName : "No file selected"}
        </span>
      </div>

      {/* Compression Info Display */}
      {compressionInfo && (
        <div
          className="compression-info"
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#e8f5e9",
            borderRadius: "4px",
            fontSize: "0.85rem",
            color: "#2e7d32",
          }}
        >
          ✓ Image optimized: {compressionInfo.originalSizeKB} KB →{" "}
          {compressionInfo.compressedSizeKB} KB (
          {compressionInfo.compressionRatio}% reduction)
        </div>
      )}

      {/* Compression Error Display */}
      {compressionError && (
        <div
          className="compression-error"
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
            fontSize: "0.85rem",
            color: "#c62828",
          }}
        >
          ✗ {compressionError}
        </div>
      )}

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
