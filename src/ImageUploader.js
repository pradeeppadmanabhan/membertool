import React, { useState, useRef, useImperativeHandle } from "react";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
//import { ref as dbRef, push, update } from "firebase/database";
import { storage } from "./firebase"; // Update the path according to your config file location
import "./global.css";

const ImageUploader = React.forwardRef(
  ({ userKey, onUploadSuccess, onDeleteSuccess }, ref) => {
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [imagePath, setImagePath] = useState(null);
    const [fileName, setFileName] = useState(""); // Store the file name for display
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
      if (e.target.files[0]) {
        setImage(e.target.files[0]);
        setFileName(e.target.files[0].name); // Store the selected file name
      }
    };

    const handleUpload = async () => {
      if (!image) {
        alert("Please select an image first!");
        return;
      }

      setUploading(true);

      try {
        // Create a storage reference
        const imagePath = `images/${userKey}/${image.name}`;
        const storageReference = storageRef(storage, imagePath);

        // Upload the image
        const snapshot = await uploadBytes(storageReference, image);
        console.log("Uploaded a file!");

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("File available at", downloadURL);

        // Call the callback function to update the image URL in the form data
        onUploadSuccess(downloadURL);
        setUploadedImageUrl(downloadURL);
        setImagePath(imagePath); // Store the image path for later deletion

        alert("Image uploaded successfully!");
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image");
      } finally {
        setUploading(false);
        setImage(null);
        setFileName(""); // Clear the file name
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear the file input
        }
      }
    };

    /*TODO: Handle removing delete button after submission*/
    const handleDelete = async () => {
      if (!uploadedImageUrl) return;

      try {
        const storageReference = storageRef(
          storage,
          imagePath // Use the stored image path for deletion
        );
        await deleteObject(storageReference);
        alert("Image deleted successfully!");

        // Call the callback to clear the image URL from the form data
        onDeleteSuccess();
        setUploadedImageUrl(null);
        setImagePath(null); // Clear the image path
        setFileName(""); // Clear the file name

        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear the file input
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image");
      }
    };

    // Function to clear/reset the selected image
    const resetUploader = () => {
      setImage(null);
      setFileName("");
      setUploadedImageUrl(null);
      setImagePath(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    // Expose the clearImage function through the ref
    useImperativeHandle(ref, () => ({
      resetUploader, // Add resetUploader to the ref
    }));

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
          {" "}
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
          <button
            onClick={handleUpload}
            className="upload-btn"
            disabled={uploading || !image}
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>

        {/* TODO: Handle removing the delete button after successful form submission.  */}
        {/* {uploadedImageUrl && (
          <div>
            <button onClick={handleDelete} className="delete-btn">
              Delete Image
            </button>
          </div>
        )} */}
      </div>
    );
  }
);

export default ImageUploader;
