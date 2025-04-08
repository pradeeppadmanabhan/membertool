// src/ProfilePage.js
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import UserProfile from "./utils/UserProfile";

const ProfilePage = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null); // State to track errors
  const [isLoading, setIsLoading] = useState(true); // State to track loading

  useEffect(() => {
    const memberID = localStorage.getItem("memberID");
    if (!userData) {
      console.error("User data is not available.");
      setError(
        "User data could not be loaded for memberID: " +
          memberID +
          ". Please contact admin with error code 'EUNM'."
      );
      setIsLoading(false);
    } else {
      console.log("ProfilePage:", userData);
      setError(null); // Clear any previous errors
      setIsLoading(false);
    }
  }, [userData, navigate]);

  if (isLoading) {
    return <div>Loading your profile...</div>; // Show a loading message or spinner
  }

  if (error) {
    return (
      <div>
        <p className="status-message error">
          Error loading your profile. <br />
          {error}
        </p>
      </div>
    ); // Display the error message
  }

  return <UserProfile memberID={userData.id} />;
};

export default ProfilePage;
