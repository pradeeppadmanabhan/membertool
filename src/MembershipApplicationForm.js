// src/MembershipApplicationForm.js
import React, { useState, useEffect, useContext } from "react";
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
import EmergencyContactDetails from "./components/EmergencyContactDetails";
import ImageUploader from "./components/ImageUploader";
import PropTypes from "prop-types"; // Import PropTypes
import AuthContext from "./AuthContext";

const STATUS_TIMEOUT = 2000; // 2 seconds in milliseconds

const MembershipApplicationForm = ({ initialMembershipType = "Annual" }) => {
  const { user, memberID, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Prop Validation using PropTypes
  MembershipApplicationForm.propTypes = {
    initialMembershipType: PropTypes.oneOf(["Annual", "Life", "Honorary"])
      .isRequired,
  };

  //console.log("user in MembershipApplicationForm:", user);
  //console.log("memberID in MembershipApplicationForm:", memberID);
  //console.log("isLoading in MembershipApplicationForm:", isLoading);

  const [formData, setFormData] = useState({
    id: memberID, // Initially set to null
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
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
    emergencyContactRelationship: "",
    mountaineeringCertifications: "", // Optional field
    currentMembershipType: initialMembershipType, // Default value - Annual
    recommendedByName: "",
    recommendedByID: "",
    imageURL: "", // New field for image URL
    signatureURL: "", // New field for signature URL
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
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /* const location = useLocation(); 
    console.log("MemberApplicationForm: isLoading", isLoading);
    console.log("MemberApplicationForm: user", user);
    console.log("MemberApplicationForm Path:", location.pathname);
    console.log("MemberApplicationForm Search:", location.search); */

    if (!isLoading && !user) {
      console.error("User is Unauthenticated, redirecting to Login Page");
      navigate("/login");
    } else if (user && memberID) {
      // Only generate Member ID when user is logged in
      //fetchMemberID();
      setFormData((prev) => ({ ...prev, id: memberID }));
    }
  }, [user, isLoading, memberID, navigate]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading your membership application...</p>
      </div>
    );
  }

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
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactEmail: "",
      emergencyContactRelationship: "",
      mountaineeringCertifications: "", // Optional field
      currentMembershipType: initialMembershipType,
      //paymentTransactionNumber: "",
      imageURL: "", // Reset image
      signatureURL: "", // Reset signature
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

    if (!formData.illnessHistory)
      formErrors.illnessHistory = "History of serious illness is required.";
    if (!formData.generalHealth)
      formErrors.generalHealth = "Present General Health is required.";
    if (!formData.emergencyContactName)
      formErrors.emergencyContactName = "Emergency contact name is required.";
    if (!formData.emergencyContactPhone)
      formErrors.emergencyContactPhone = "Emergency contact phone is required.";
    if (
      formData.emergencyContactPhone &&
      !/^\d{10}$/.test(formData.emergencyContactPhone)
    )
      formErrors.emergencyContactPhone =
        "Emergency contact phone must be 10 digits.";
    if (!formData.emergencyContactEmail)
      formErrors.emergencyContactEmail = "Emergency contact email is required.";
    if (
      formData.emergencyContactEmail &&
      !/\S+@\S+\.\S+/.test(formData.emergencyContactEmail)
    )
      formErrors.emergencyContactEmail =
        "Emergency contact email format is invalid.";
    if (!formData.emergencyContactRelationship)
      formErrors.emergencyContactRelationship =
        "Emergency contact relationship is required.";

    if (!formData.recommendedByName)
      formErrors.recommendedByName = "Recommended by name is required.";
    return formErrors;
  };

  const validateImage = (image, fieldName) => {
    let imageErrors = {};

    if (!image) {
      imageErrors[fieldName] =
        `Please upload a ${fieldName === "imageURL" ? "passport size photo" : "specimen signature"}.`;
    } else {
      // Image type validation (example: allow only JPEG and PNG)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(selectedImage.type)) {
        imageErrors[fieldName] = "Only JPEG/JPG and PNG images are allowed.";
      }

      // Image size validation (example: maximum 2MB)
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (selectedImage.size > maxSizeInBytes) {
        imageErrors[fieldName] = "Image size must be less than 2MB.";
      }
    }

    return imageErrors;
  };

  const handleValidate = () => {
    const formErrors = validateForm();
    const imageErrors = {
      ...validateImage(selectedImage, "imageURL"),
      ...validateImage(selectedSignature, "signatureURL"),
    };
    const allErrors = { ...formErrors, ...imageErrors };

    setErrors(allErrors);

    return allErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validtionErrors = handleValidate();

    if (Object.keys(validtionErrors).length > 0) {
      setStatusMessage(
        <React.Fragment>
          <b>Please fix the errors before submitting:</b>
          <br />
          {Object.values(errors).map((message, index) => (
            <React.Fragment key={index}>
              {message}
              <br />
            </React.Fragment>
          ))}
        </React.Fragment>
      );
      setIsSubmitting(false);
      return;
    }

    try {
      //console.log("Generated Member ID:", newMemberId);
      const newMemberId = formData.id;
      let uploadedImageUrl = null;
      let uploadedSignatureUrl = null;

      // 2. Upload Image (if selected)
      if (newMemberId) {
        // Upload Profile Photo

        if (selectedImage) {
          const imagePath = `images/${newMemberId}/${selectedImage.name}`;
          const storageReference = storageRef(storage, imagePath);
          const snapshot = await uploadBytes(storageReference, selectedImage);
          uploadedImageUrl = await getDownloadURL(snapshot.ref);
        }

        // Upload Signature Image

        if (selectedSignature) {
          const signaturePath = `signatures/${newMemberId}/${selectedSignature.name}`;
          const storageReference = storageRef(storage, signaturePath);
          const snapshot = await uploadBytes(
            storageReference,
            selectedSignature
          );
          uploadedSignatureUrl = await getDownloadURL(snapshot.ref);
        }
      } else {
        console.error("Member ID is not generated yet.");
        setStatusMessage("Member ID is not generated yet.");
        setIsSubmitting(false); // Reset submitting state if ID generation fails
        return;
      }

      const age = calculateAge(formData.dob);
      //setFormData({ ...formData, age });

      // 4. Submit Data to Firebase
      try {
        const userData = {
          ...formData,
          id: newMemberId,
          imageURL: uploadedImageUrl,
          signatureURL: uploadedSignatureUrl,
          dateOfSubmission: new Date().toISOString(),
          age: age,
          payments: [],
        };

        let targetPage = ``;

        if (userData.currentMembershipType === "Honorary") {
          userData.renewalDueOn = "N/A";
          const paymentRecord = {
            paymentMode: "N/A",
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
          targetPage = `/payment-details?memberID=${newMemberId}&membershipType=${formData.currentMembershipType}`;
        }

        //console.log("Submitting to id:", newMemberId);

        const userRef = ref(database, `users/${newMemberId}`);
        await set(userRef, userData);

        console.log("Data submitted successfully!");
        setStatusMessage(
          "Application submitted successfully!, moving to payment page in about 2 seconds.."
        );

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
      <label>Upload your specimen signature photo to record consent*</label>
      <ImageUploader
        onImageSelect={(image) => {
          setSelectedSignature(image);
          setErrors((prevErrors) => ({ ...prevErrors, signatureURL: "" })); // Clear the error
        }}
        selectedImage={selectedSignature}
      />
      {errors.signatureURL && (
        <span className="error">{errors.signatureURL}</span>
      )}
      <h3>Provisional Application ID: {formData.id} </h3>
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
      {/* Emergency Contact Details */}
      <EmergencyContactDetails
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
      <label>Upload Profile Picture*</label>
      <ImageUploader
        onImageSelect={(image) => {
          setSelectedImage(image);
          setErrors((prevErrors) => ({ ...prevErrors, imageURL: "" })); // Clear the error
        }}
        selectedImage={selectedImage}
      />
      {errors.imageURL && <span className="error">{errors.imageURL}</span>}
      {/* Display image upload error */}
      <br />
      <br />
      <div className="button-container">
        <button type="submit" disabled={!formData.consent || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
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
