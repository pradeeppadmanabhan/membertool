// src/ProfilePage.js
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import UserProfile from "./utils/UserProfile";

const ProfilePage = () => {
  const { userData, isNewUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null); // State to track errors
  const [isLoading, setIsLoading] = useState(true); // State to track loading

  useEffect(() => {
    const memberID = localStorage.getItem("memberID");

    if (!memberID && isNewUser) {
      console.log("New user detected. Redirecting to application form.");
      navigate("/new-application");
      return;
    }

    if (!memberID) {
      console.error("Member ID is not available.");
      setError(
        "Member ID could not be loaded. Please contact admin with error code 'EMID'."
      );
      setIsLoading(false);
      return;
    }

    if (!userData) {
      console.error("User data is not available for memberID: " + memberID);
      setError(
        "User data could not be loaded for memberID: " +
          memberID +
          ". Please contact admin with error code 'EUPNF' (Error: User Profile Not Found)."
      );
      setIsLoading(false);
      return;
    }

    if (userData && userData.id !== memberID) {
      console.error(
        "Mismatch between memberID in localStorage and UserData: ",
        memberID,
        userData.id
      );
      setError(
        "Mismatch between memberID in localStorage and UserData. Please contact admin with error code 'EUMISMATCH'."
      );
      setIsLoading(false);
      return;
    }

    console.log("ProfilePage:", userData);
    setError(null); // Clear any previous errors
    setIsLoading(false);
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

  return <UserProfile memberID={userData?.id} />;
};

export default ProfilePage;
