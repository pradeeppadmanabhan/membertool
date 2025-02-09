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
      navigate("/welcome");
    }
  }, [userData, navigate]);

  return <UserProfile userData={userData} />;
};

export default ProfilePage;
