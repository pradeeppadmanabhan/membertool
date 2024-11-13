// src/MembershipApplicationForm.js
import React, { useState, useRef } from "react";
import { database, storage } from "./firebase"; // Import the Firebase config
import { ref, set } from "firebase/database"; // Import necessary functions - , push
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "./global.css";
import DeclarationConsent from "./components/DeclarationConsent";
import PersonalInfo from "./components/PersonalInfo";
import ContactInfo from "./components/ContactInfo";
import BackgroundHealth from "./components/BackgroundHealth";
import MembershipDetails from "./components/MembershipDetails";
import ImageUploader from "./components/ImageUploader";
import PropTypes from "prop-types"; // Import PropTypes
import { getFunctions, httpsCallable } from "firebase/functions";

const STATUS_TIMEOUT = 10000; // 10 seconds in milliseconds

const MembershipApplicationForm = ({ initialMembershipType = "Annual" }) => {
  // Prop Validation using PropTypes
  MembershipApplicationForm.propTypes = {
    initialMembershipType: PropTypes.oneOf(["Annual", "Life", "Honorary"])
      .isRequired,
  };
  const [formData, setFormData] = useState({
    id: null, // Initially set to null
    memberName: "",
    age: "",
    dob: "",
    gender: "",
    fatherGuardianName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    landline: "",
    mobile: "",
    email: "",
    qualifications: "",
    profession: "",
    athleticBackground: "",
    trekkingExperience: "",
    hobbies: "",
    illnessHistory: "",
    generalHealth: "",
    bloodGroup: "",
    membershipType: initialMembershipType, // Default value - Annual
    paymentTransactionNumber: "",
    recommendedByName: "",
    recommendedByID: "",
    imageURL: "", // New field for image URL
    consent: false, // New field for consent

    // New fields with initial values
    applicationStatus: "Submitted", // Default status on submission
    approvedBy: null,
    dateOfSubmission: new Date().toISOString(), // Set on form submission
    dateOfApproval: null,
    dateOfPayment: null,
    renewalDueOn: null,
    transactionDetail: null,
    receiptNo: null,
    amount: null,
  });

  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const [generatedMemberId, setGeneratedMemberId] = useState(null);
  const functions = getFunctions();
  const generateMemberId = httpsCallable(functions, "generateMemberId");

  // Reference to the ImageUploader component
  const imageUploaderRef = useRef(null);

  const validate = () => {
    //console.log("Validating form data:", formData);
    let newErrors = {};
    if (!formData.memberName) newErrors.memberName = "Name is required.";
    if (!formData.dob) newErrors.dob = "Date of Birth is required.";
    if (!formData.age || formData.age <= 0)
      newErrors.age = "Age must be a positive number.";
    if (!formData.gender) newErrors.gender = "Gender is required.";
    if (!formData.fatherGuardianName)
      newErrors.fatherGuardianName = "Father/Guardian Name is required.";
    if (!formData.addressLine1)
      newErrors.addressLine1 = "Address Line 1 is required.";
    if (!formData.addressLine2)
      newErrors.addressLine2 = "Address Line 2 is required.";
    if (!formData.addressLine3)
      newErrors.addressLine3 = "Address Line 3 is required.";
    if (!formData.mobile) {
      newErrors.mobile = "Mobile is required.";
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile))
      newErrors.mobile = "Mobile number must be 10 digits.";

    if (!formData.email) newErrors.email = "Email is required.";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email format is invalid.";

    if (formData.landline && !/^\d+$/.test(formData.landline))
      newErrors.landline = "Landline number must be numeric.";
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood Group is required.";

    return newErrors;
  };

  const resetImageUploader = () => {
    if (imageUploaderRef.current) {
      imageUploaderRef.current.resetUploader(); // Call the reset function on ImageUploader
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
    setStatusMessage(""); // Clear the status message
  };

  const handleClear = () => {
    setFormData((prevData) => ({
      ...prevData,
      // Reset only specific fields while keeping the ID and defaults
      memberName: "",
      age: "",
      dob: "",
      gender: "",
      fatherGuardianName: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      landline: "",
      mobile: "",
      email: "",
      qualifications: "",
      profession: "",
      athleticBackground: "",
      trekkingExperience: "",
      hobbies: "",
      illnessHistory: "",
      generalHealth: "",
      bloodGroup: "",
      membershipType: initialMembershipType,
      //paymentTransactionNumber: "",
      imageURL: "", // Reset image URL
      recommendedByName: "",
      recommendedByID: "",
      consent: false, // Reset consent to Decline
      // Keep any ID or default fields as they are
    }));
    // Clear the uploaded image in ImageUploader
    resetImageUploader();
    setErrors({});
    setStatusMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation
    //console.log("handleSubmit - Form data:", formData);
    const validationErrors = validate();
    setErrors(validationErrors); //update errors state immediately

    if (Object.keys(validationErrors).length > 0) {
      console.error("Validation errors:", validationErrors);
      //Don't submit if there are errors
      // 1. Create a String of Errors
      const errorMessages = Object.values(validationErrors).join("<br />"); // Join with line breaks

      // 2. Display the Combined Errors
      setStatusMessage(
        <React.Fragment>
          <b>Please fix the errors before submitting:</b>
          <br />
          {errorMessages.split("<br />").map((message, index) => (
            <React.Fragment key={index}>
              {message}
              <br />
            </React.Fragment>
          ))}
        </React.Fragment>
      );
      return;
    }

    // 2. Generate Member ID
    if (!generatedMemberId) {
      try {
        const { data } = await generateMemberId({
          membershipType: formData.membershipType,
        });
        setGeneratedMemberId(data.memberId);
        console.log("Generated Member ID:", generatedMemberId);
      } catch (error) {
        console.error("Error generating member ID:", error);
        return;
        // Handle error appropriately (e.g., set a default ID or show an error message)
      }
    }

    // 3. Consent Check
    if (!formData.consent) {
      setErrors({ consent: "Consent is required." }); // Show error if not accepted
      return;
    }

    //4. Upload Image (if selected)
    let uploadedImageUrl = null;
    if (selectedImage) {
      try {
        const imagePath = `images/${generatedMemberId}/${selectedImage.name}`;
        const storageReference = storageRef(storage, imagePath);
        const snapshot = await uploadBytes(storageReference, selectedImage);
        uploadedImageUrl = await getDownloadURL(snapshot.ref);
        //console.log("Uploaded Image URL:", uploadedImageUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
    // Image validation
    if (!uploadedImageUrl) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        imageURL: "Please upload a passport size photo.",
      }));
      return; // Don't submit if image upload failed
    }

    // 5. Submit Data to Firebase
    try {
      // Add the data to Firestore
      console.log("Submitting Member ID:", generatedMemberId);
      const userData = {
        ...formData,
        id: generatedMemberId,
        imageURL: uploadedImageUrl,
        dateOfSubmission: new Date().toISOString(), // Add current date
      };
      //console.log("Submitting data...", userData);
      //await addDoc(collection(database, "users"), userData);
      /*TODO: Update the JSON Packaging before uploading to DB.*/
      const userRef = ref(database, `users/${generatedMemberId}`); // Use formData.key for the database reference
      await set(userRef, userData); // Set the user data
      console.log("Data submitted successfully!");
      setStatusMessage("Application submitted successfully!");

      // Delay clearing the form to allow the user to see the success message
      setTimeout(() => {
        handleClear(); // Clear the form after a short delay
      }, STATUS_TIMEOUT); // Adjust the delay (in milliseconds) as needed
    } catch (error) {
      console.error("Error submitting application: ", error);
      // Improved Error Handling:
      let errorMessage = "Error submitting application. Please try again.";

      // Check for common Firebase errors and provide specific messages
      if (error.code === "permission-denied") {
        errorMessage =
          "Permission denied to write to the database. Please contact the administrator.";
      } else if (error.code === "unavailable") {
        errorMessage =
          "Database is temporarily unavailable. Please try again later.";
      } else if (error.message) {
        // If Firebase provides a message, use it, but consider sanitizing for user-friendliness
        errorMessage = `Error: ${error.message}`;
      }

      setStatusMessage(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Declaration and Consent */}
      <DeclarationConsent
        formData={formData}
        errors={errors}
        setFormData={setFormData}
      />
      <br />
      {/* Personal Information */}
      <PersonalInfo
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
      <br />
      {/* Contact Information */}
      <ContactInfo
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
      <br />
      {/* Background & Health */}
      <BackgroundHealth
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
      <br />
      {/* Membership Details */}
      <MembershipDetails
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
      <br />
      {/* Image Uploader */}
      <label>Upload Passport Size Photo*</label>
      <ImageUploader onImageSelect={setSelectedImage} />
      {errors.imageURL && <span className="error">{errors.imageURL}</span>}{" "}
      {/* Display image upload error */}
      <br />
      <button type="submit" disabled={!formData.consent}>
        Submit
      </button>
      <button type="button" onClick={handleClear}>
        Clear
      </button>
      {/* Conditional message for consent */}
      {!formData.consent && (
        <p className="consent-message">
          Please accept the declaration to submit the form.
        </p>
      )}
      {statusMessage && (
        <p
          className={`status-message ${
            Object.keys(errors).length > 0 ? "error" : ""
          }`}
        >
          {statusMessage}
        </p>
      )}
    </form>
  );
};

export default MembershipApplicationForm;
