// src/MembershipApplicationForm.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import AuthContext from "./AuthContext";

const STATUS_TIMEOUT = 5000; // 5 seconds in milliseconds

const MembershipApplicationForm = ({ initialMembershipType = "Annual" }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Prop Validation using PropTypes
  MembershipApplicationForm.propTypes = {
    initialMembershipType: PropTypes.oneOf(["Annual", "Life", "Honorary"])
      .isRequired,
  };
  const [formData, setFormData] = useState({
    id: null, // Initially set to null
    memberName: user?.displayName || "",
    uid: user?.uid || "",
    age: "",
    dob: "",
    gender: "",
    fatherGuardianName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    mobile: "",
    email: user?.email || "",
    qualifications: "",
    profession: "",
    athleticBackground: "",
    trekkingExperience: "",
    hobbies: "",
    illnessHistory: "",
    generalHealth: "",
    bloodGroup: "",
    currentMembershipType: initialMembershipType, // Default value - Annual
    recommendedByName: "",
    recommendedByID: "",
    imageURL: "", // New field for image URL
    consent: false, // New field for consent

    // New fields with initial values
    applicationStatus: "Submitted", // Default status on submission
    dateOfSubmission: new Date().toISOString(), // Set on form submission
    renewalDueOn: null,
    whatsappGroupStatus: "Add", //Available states -> "Add", "Added", "Remove", "Removed"
  });

  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const functions = getFunctions();
  const generateMemberId = httpsCallable(functions, "generateMemberId");

  const fetchMemberID = useCallback(async () => {
    try {
      const { data } = await generateMemberId({
        currentMembershipType: initialMembershipType,
      });
      console.log("MemberID generated successfully:", data.memberId);
      setFormData((prev) => ({ ...prev, id: data.memberId }));
    } catch (error) {
      console.error("Error generating member ID:", error);
    }
  }, [initialMembershipType, generateMemberId]);

  useEffect(() => {
    if (!user) {
      console.error("User Unauthenticated, redirecting to Login Page");
      navigate("/login");
      return;
    }

    //console.log("Generating ID for user: ", user.displayName, user.uid);

    fetchMemberID();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
    setStatusMessage(""); // Clear the status message
  };

  const handleBlur = (e) => {
    //const { name, value } = e.target;
    const enteredDate = new Date(e.target.value);
    const today = new Date();
    const minDate = new Date("1900-01-01");

    if (isNaN(enteredDate) || enteredDate > today || enteredDate < minDate) {
      setFormData({ ...formData, dob: "" });
      setErrors({
        ...errors,
        dob: "Date of Birth cannot be invalid or in the future",
      });
      setStatusMessage("Date of Birth cannot be invalid or in the future");
    }
  };

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    //console.log("Calculated Age:", age, " years");
    return age;
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
      currentMembershipType: initialMembershipType,
      //paymentTransactionNumber: "",
      imageURL: "", // Reset image URL
      recommendedByName: "",
      recommendedByID: "",
      consent: false, // Reset consent to Decline
      // Keep any ID or default fields as they are
    }));
    // Clear the uploaded image in ImageUploader
    setSelectedImage(null);
    setErrors({});
    setStatusMessage("");
  };

  const validateForm = () => {
    let formErrors = {};
    if (!formData.consent) formErrors.consent = "Consent is required.";
    if (!formData.memberName) formErrors.memberName = "Name is required.";
    if (!formData.dob) formErrors.dob = "Date of Birth is required.";
    if (!formData.gender) formErrors.gender = "Gender is required.";
    if (!formData.fatherGuardianName)
      formErrors.fatherGuardianName = "Father/Guardian Name is required.";
    if (!formData.addressLine1)
      formErrors.addressLine1 = "Address Line 1 is required.";
    if (!formData.addressLine2)
      formErrors.addressLine2 = "Address Line 2 is required.";
    if (!formData.addressLine3)
      formErrors.addressLine3 = "Address Line 3 is required.";
    if (!formData.mobile) {
      formErrors.mobile = "Mobile is required.";
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile))
      formErrors.mobile = "Mobile number must be 10 digits.";

    if (!formData.email) formErrors.email = "Email is required.";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      formErrors.email = "Email format is invalid.";

    /* if (formData.landline && !/^\d+$/.test(formData.landline))
      formErrors.landline = "Landline number must be numeric."; */
    if (!formData.bloodGroup)
      formErrors.bloodGroup = "Blood Group is required.";

    return formErrors;
  };

  const validateImage = () => {
    let imageErrors = {};

    if (!selectedImage) {
      imageErrors.imageURL = "Please upload a passport size photo.";
    } else {
      // Image type validation (example: allow only JPEG and PNG)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(selectedImage.type)) {
        imageErrors.imageURL = "Only JPEG/JPG and PNG images are allowed.";
      }

      // Image size validation (example: maximum 2MB)
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (selectedImage.size > maxSizeInBytes) {
        imageErrors.imageURL = "Image size must be less than 2MB.";
      }
    }

    return imageErrors;
  };

  const handleValidate = () => {
    const formErrors = validateForm();
    const imageErrors = validateImage();
    setErrors({ ...formErrors, ...imageErrors });

    // Check for errors only once
    if (Object.keys({ ...formErrors, ...imageErrors }).length > 0) {
      setStatusMessage(
        <React.Fragment>
          <b>Please fix the errors before submitting:</b>
          <br />
          {Object.values({ ...formErrors, ...imageErrors }).map(
            (message, index) => (
              <React.Fragment key={index}>
                {message}
                <br />
              </React.Fragment>
            )
          )}
        </React.Fragment>
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    handleValidate();

    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      //console.log("Generated Member ID:", newMemberId);
      const newMemberId = formData.id;

      // 2. Upload Image (if selected)
      let uploadedImageUrl = null;
      if (selectedImage) {
        if (newMemberId) {
          try {
            const imagePath = `images/${newMemberId}/${selectedImage.name}`;
            const storageReference = storageRef(storage, imagePath);
            const snapshot = await uploadBytes(storageReference, selectedImage);
            uploadedImageUrl = await getDownloadURL(snapshot.ref);
            console.log("Uploaded Image URL:", uploadedImageUrl);
          } catch (error) {
            console.error("Error uploading image:", error);
            // Handle upload error (e.g., show an error message)
            setIsSubmitting(false); // Reset submitting state if image upload fails
            return;
          }
        } else {
          console.log("Member ID not generated yet, unable to upload image.");
          console.error("Member ID not generated yet, unable to upload image.");
          setStatusMessage(
            "Member ID not generated yet, unable to upload image."
          );
        }
      }

      const age = calculateAge(formData.dob);
      //setFormData({ ...formData, age });

      // 4. Submit Data to Firebase
      try {
        const userData = {
          ...formData,
          id: newMemberId,
          imageURL: uploadedImageUrl,
          dateOfSubmission: new Date().toISOString(),
          age: age,
          payments: [],
        };

        let targetPage = ``;

        if (userData.currentMembershipType === "Honorary") {
          userData.renewalDueOn = "N/A";
          const paymentRecord = {
            paymentMode: "Cash",
            transactionReference: "honorary",
            amount: 0,
            receiptNo: "honorary",
            dateOfPayment: new Date().toISOString(),
            applicationStatus: "Paid",
            membershipType: "Honorary",
          };
          userData.payments.push(paymentRecord);
          targetPage = `/thank-you/honorary/${newMemberId}`;
        } else {
          targetPage = `/payment-details/${newMemberId}/${formData.currentMembershipType}`;
        }

        //console.log("Submitting to id:", newMemberId);

        const userRef = ref(database, `users/${newMemberId}`);
        await set(userRef, userData);

        console.log("Data submitted successfully!");
        setStatusMessage("Application submitted successfully!");

        // Delay clearing the form
        setTimeout(() => {
          handleClear();
          navigate(targetPage, { state: { memberData: userData } });
        }, STATUS_TIMEOUT);
      } catch (error) {
        // ... (Error handling for database submission)
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
    } catch (error) {
      // ... (Error handling for generateMemberId)
      console.error("Error generating member ID:", error);
    } finally {
      setIsSubmitting(false); // Reset submitting state after all operations
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Declaration and Consent */}
      <DeclarationConsent
        formData={formData}
        errors={errors}
        setFormData={setFormData}
        setErrors={setErrors}
        setStatusMessage={setStatusMessage}
      />
      <br />
      {/* Personal Information */}
      <PersonalInfo
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
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
      <ImageUploader
        onImageSelect={setSelectedImage}
        selectedImage={selectedImage}
      />
      {errors.imageURL && <span className="error">{errors.imageURL}</span>}{" "}
      {/* Display image upload error */}
      <br />
      <br />
      <button type="submit" disabled={!formData.consent || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
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
