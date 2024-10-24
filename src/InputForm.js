// src/InputForm.js
import React, { useState, useEffect, useRef } from "react";
import { database } from "./firebase"; // Import the Firebase config
//import { collection, addDoc, getDocs } from "firebase/firestore";
import {
  ref,
  set,
  get,
  query,
  orderByKey,
  orderByChild,
  startAt,
  endAt,
  limitToLast,
} from "firebase/database"; // Import necessary functions - , push
import "./global.css";
import logo from "./KMALogo.png"; // Import the image
import ImageUploader from "./ImageUploader";

const STATUS_TIMEOUT = 10000; // 10 seconds in milliseconds

// Reusable function to get the next available user node number
const getNextUserNodeNumber = async () => {
  try {
    const usersRef = ref(database, "users");
    const lastUserQuery = query(
      usersRef,
      orderByKey(), // Order by key to get the highest numerical key
      limitToLast(1)
    );

    const lastUserSnapshot = await get(lastUserQuery);
    //console.log("Last User Snapshot:", lastUserSnapshot.val());

    if (lastUserSnapshot.exists()) {
      const lastUserKey = Object.keys(lastUserSnapshot.val())[0]; // Get the key (e.g., 'user10')
      //console.log("Last User Key:", lastUserKey);
      const lastUserNumber = parseInt(lastUserKey.substring(4), 10); // Extract the number
      //console.log("Last User Number:", lastUserNumber);
      return lastUserNumber + 1;
    } else {
      return 1; // Start from 1 if there are no users
    }
  } catch (error) {
    console.error("Error getting next user node number:", error);
    return 1; // Default to 1 in case of an error
  }
};

const InputForm = () => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
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
    membershipType: "Annual", // Default value
    paymentTransactionNumber: "",
    recommendedByName: "",
    recommendedByID: "",
    imageURL: "", // New field for image URL
    consent: false, // New field for consent
  });

  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");

  // Function to generate the member ID (LMXXXX or AMXXXX)
  const generateMemberId = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const membershipTypePrefix =
        formData.membershipType === "Life" ? "LM" : "AM";

      // Get the last user ID with the same membership type prefix
      const usersRef = ref(database, "users");
      const lastUserQuery = query(
        usersRef,
        orderByChild("id"),
        startAt(membershipTypePrefix), // Start searching from IDs with the correct prefix
        endAt(membershipTypePrefix + "\uf8ff"), // End search at IDs with the prefix + a very high character
        limitToLast(1)
      );

      const lastUserSnapshot = await get(lastUserQuery);

      let newId = `${membershipTypePrefix}${currentYear}001`; // Default ID for the year

      if (lastUserSnapshot.exists()) {
        const lastUserData = Object.values(lastUserSnapshot.val())[0];
        const lastUserId = lastUserData.id;
        const lastUserYear = parseInt(lastUserId.substring(2, 6), 10);
        const lastUserNumber = parseInt(lastUserId.substring(6), 10);

        if (lastUserYear === currentYear) {
          const newNumber = (lastUserNumber + 1).toString().padStart(3, "0");
          newId = `${membershipTypePrefix}${currentYear}${newNumber}`;
        }
      }

      return newId;
    } catch (error) {
      console.error("Error generating member ID:", error);
      // Handle error (e.g., return a default ID or throw an error)
    }
  };

  useEffect(() => {
    const initializeFormData = async () => {
      try {
        const newId = await generateMemberId();
        const nextUserNumber = await getNextUserNodeNumber();
        const userKey = `user${nextUserNumber.toString().padStart(5, "0")}`;

        //console.log("New ID:", newId);
        //console.log("Next User Number:", nextUserNumber);
        //console.log("User Key:", userKey);

        setFormData((prevData) => ({
          ...prevData,
          id: newId,
          key: userKey, // Set the generated user key here
        }));
        //console.log("Form data initialized:", formData);
      } catch (error) {
        console.error("Error initializing form data:", error);
        // Handle error appropriately
      }
    };

    initializeFormData();
  }, [formData.membershipType]);

  const validate = () => {
    //console.log("Validating form data:", formData);
    let newErrors = {};
    if (!formData.name) newErrors.name = "Name is required.";
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
    //if (!formData.consent) newErrors.consent = "Consent is required."; // Consent validation
    // Image validation
    if (!formData.imageURL) {
      newErrors.imageURL = "Please upload a passport size photo.";
    }

    return newErrors;
  };

  // Function to update the imageURL in the form data
  const handleImageUploadSuccess = (downloadURL) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      imageURL: downloadURL,
    }));
    // Clear the image upload error
    setErrors((prevErrors) => ({
      ...prevErrors,
      imageURL: "", // Reset the imageURL error
    }));
  };

  const handleImageDeleteSuccess = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      imageURL: "",
    }));
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
      name: "",
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
      membershipType: "Annual",
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

    if (!formData.consent) {
      setErrors({ consent: "Consent is required." }); // Show error if not accepted
      return;
    }

    try {
      // Add the data to Firestore
      const userData = {
        ...formData,
        //key: formData.id, // Add the ID as a key,
        date: new Date().toISOString(), // Add current date
      };
      //console.log("Submitting data...", userData);
      //await addDoc(collection(database, "users"), userData);
      /*TODO: Update the JSON Packaging before uploading to DB.*/
      const userRef = ref(database, `users/${formData.key}`); // Use formData.key for the database reference
      await set(userRef, userData); // Set the user data
      console.log("Data submitted successfully!");
      setStatusMessage("Application submitted successfully!");
      resetImageUploader(); // Reset the image uploader after clearing the form
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

  // Reference to the ImageUploader component
  const imageUploaderRef = useRef(null);

  return (
    <form onSubmit={handleSubmit}>
      {/* <h1>Application for Membership</h1> */}
      <div>
        <div className="header-container">
          {/* Add a container for the header */}
          <img src={logo} alt="KMA Logo" className="logo-image" />
          <h1>THE KARNATAKA MOUNTAINEERING ASSOCIATION (R)</h1>
        </div>
        Room No 205, I Floor, Kanteerava Sports Complex – 2, Kanteerava Stadium
        premises, Kasturba Road, Bangalore – 560 001
        <br />
        T: +91 80 22113333 E: info@kmaindia.org
        <br />
        W: www.kmaindia.org FB: www.facebook.com\kmaindia
        <h3>APPLICATION FOR MEMBERSHIP </h3>
        <div className="declaration-text">
          {" "}
          {/*Add class for styling */}
          <br />
          To, <br />
          The Honorary Secretary <br />
          Karnataka Mountaineering Association <br />
          ‘Room No.205, I Floor, Kanteerava Sports Complex – 2, <br />
          Kanteerava Stadium premises, Kasturba Road, <br />
          <br />
          Bangalore – 560 001
          <br />
          <br />
          Dear Sir / Madam,
          <br />
          I hereby apply for Membership of your Association, subscribing to the
          DECLARATION below and furnishing my particulars overleaf which are
          true to the best of my knowledge and belief.
          <br />I am interested in Mountaineering and undertake to abide by the
          Rules and Regulations and as per the by laws / memorandum of the
          Association.{" "}
          <b>I provide my consent by "accepting" this declaration.</b>
          <br />
          <br />
          <h3>DECLARATION</h3>
          <br />
          <br />
          I, as Member of the above Association hereby undertake to absolve the
          Association, its Office bearers and any other person, or persons
          acting on its behalf, of any disability or calamity to my person due
          to any accident during the outings, expeditions, training and other
          activities held under the auspices of the Association. I undertake and
          sign this declaration will fully and with all my senses under control.
          <br />
          <br />I hope you will kindly accept my membership.
          {/* <br />
          Yours faithfully
          <br />
          Note – In case of Minor, Guardian should sign.
          <br />
          Signature and date */}
          <br />
          <br />
          {/* <i>Digital Form, hence no Signature required.</i> */}
        </div>
        <div className="radio-group">
          {" "}
          {/* Use the new class for alignment */}
          <label>Consent*:</label>
          <label>
            <input
              type="radio"
              name="consent"
              value="accept"
              checked={formData.consent === true}
              onChange={() => setFormData({ ...formData, consent: true })}
            />
            I Accept
          </label>
          <label>
            <input
              type="radio"
              name="consent"
              value="decline"
              checked={formData.consent === false}
              onChange={() => setFormData({ ...formData, consent: false })}
            />
            I Decline
          </label>
          {errors.consent && <span className="error">{errors.consent}</span>}
        </div>
      </div>
      <br />
      {/* <label>ID:</label>
      <input type="text" name="id" value={formData.id} readOnly /> */}
      <label>Applicant's Full Name*:</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      {errors.name && <span className="error">{errors.name}</span>}
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
      <label>Address Line1*:</label>
      <input
        type="text"
        name="addressLine1"
        value={formData.addressLine1}
        onChange={handleChange}
      />
      {errors.addressLine1 && (
        <span className="error">{errors.addressLine1}</span>
      )}
      <br />
      <label>Address Line2*:</label>
      <input
        type="text"
        name="addressLine2"
        value={formData.addressLine2}
        onChange={handleChange}
      />
      {errors.addressLine2 && (
        <span className="error">{errors.addressLine2}</span>
      )}
      <br />
      <label>Address Line3*:</label>
      <input
        type="text"
        name="addressLine3"
        value={formData.addressLine3}
        onChange={handleChange}
      />
      {errors.addressLine3 && (
        <span className="error">{errors.addressLine3}</span>
      )}
      <br />
      <label>Landline:</label>
      <input
        type="text"
        name="landline"
        value={formData.landline}
        onChange={handleChange}
      />
      {errors.landline && <span className="error">{errors.landline}</span>}
      <br />
      <label>Mobile*:</label>
      <input
        type="text"
        name="mobile"
        value={formData.mobile}
        onChange={handleChange}
      />
      {errors.mobile && <span className="error">{errors.mobile}</span>}
      <br />
      <label>E-mail ID*:</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      {errors.email && <span className="error">{errors.email}</span>}
      <br />
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
      <label>History of serious illness/injury, if any:</label>
      <textarea
        name="illnessHistory"
        value={formData.illnessHistory}
        onChange={handleChange}
      />
      <label>Present General Health:</label>
      <textarea
        name="generalHealth"
        value={formData.generalHealth}
        onChange={handleChange}
      />
      <label>Blood Group*:</label>
      <input
        type="text"
        name="bloodGroup"
        value={formData.bloodGroup}
        onChange={handleChange}
      />
      {errors.bloodGroup && <span className="error">{errors.bloodGroup}</span>}
      <br />
      <label>Membership Type*:</label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="membershipType"
            value="Life"
            checked={formData.membershipType === "Life"}
            onChange={handleChange}
          />
          Life (Rs.2000 + charges)
        </label>
        <label>
          <input
            type="radio"
            name="membershipType"
            value="Annual"
            checked={formData.membershipType === "Annual"}
            onChange={handleChange}
          />
          Annual (Rs.250 + charges)
        </label>
      </div>
      <br />
      {/* <label>Payment Transaction Number:</label>
      <input
        type="text"
        name="paymentTransactionNumber"
        value={formData.paymentTransactionNumber}
        onChange={handleChange}
        pattern="[A-Za-z0-9]+" // Alphanumeric pattern        
      /> */}
      <div>
        <label>Recommended By:</label>
        <label>Name of the person recommending you:</label>
        <input
          type="text"
          name="recommendedByName"
          value={formData.recommendedByName}
          onChange={handleChange}
        />
        <label>KMA Member ID of the person recommending you:</label>
        <input
          type="text"
          name="recommendedByID"
          value={formData.recommendedByID}
          onChange={handleChange}
        />
      </div>
      <label>Upload Passport Size Photo*</label>
      <ImageUploader
        userKey={formData.key}
        onUploadSuccess={handleImageUploadSuccess}
        onDeleteSuccess={handleImageDeleteSuccess}
      />
      {errors.imageURL && <span className="error">{errors.imageURL}</span>}{" "}
      {/* Display image upload error */}
      <br />
      {formData.imageURL && (
        <div>
          <h4>Uploaded Image:</h4>
          <img src={formData.imageURL} alt="Uploaded" width="200" />
        </div>
      )}
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
      {/* {statusMessage && <p className="status-message">{statusMessage}</p>} */}
    </form>
  );
};

export default InputForm;
