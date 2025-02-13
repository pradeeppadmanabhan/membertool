// src/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "./AuthContext";

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  //console.log("User in ProtectedRoute:", user);
  //console.log("Required Roles:", requiredRoles);

  if (!user) {
    // Redirect to login page if not logged in
    console.log("Protected Route - User not logged in, redirecting...");
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else if (
    requiredRoles &&
    !requiredRoles.includes(user.email) // Check if user's email is in allowed roles
  ) {
    //console.log("Protected Route - User not authorized, redirecting...");
    // Redirect to a "not authorized" page or display a message
    return <div>You are not authorized to access this page.</div>;
  } else {
    //console.log("Protected Route - User is authorized, rendering children...");
    return children;
  }
};

export default ProtectedRoute;
