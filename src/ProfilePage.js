// src/ProfilePage.js
import React, { useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import UserProfile from "./utils/UserProfile";

const ProfilePage = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      console.error("User data is not available.");
      return <>Hmm, something's wrong, I can't find a user.</>;
    } else {
      console.log("ProfilePage:", userData);
    }
  }, [userData, navigate]);

  return <UserProfile memberID={userData.id} />;
};

export default ProfilePage;
