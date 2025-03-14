// src/LoginPage.js
import React from "react";
import { useContext } from "react";
import AuthContext from "./AuthContext.js";

const LoginPage = () => {
  const { signInWithGoogle } = useContext(AuthContext);
  return (
    <div>
      <h2>Please Sign In</h2>
      <p>You need to sign in with your Google account to access this page.</p>
      <div>
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      </div>
    </div>
  );
};

export default LoginPage;
