import React from "react";
import "./global.css";
import logo from "./KMALogo.png"; // Import your logo
import { useContext } from "react";
import AuthContext from "./AuthContext.js";

const WelcomePage = () => {
  const { signInWithGoogle } = useContext(AuthContext);
  return (
    <div className="mt-5">
      <div className="content">
        <img src={logo} alt="KMA Logo" className="logo-image" />
        <h1>Welcome to the Karnataka Mountaineering Association</h1>
        <p>Your gateway to adventure, fitness, and the majestic mountains.</p>
        <div>
          <button onClick={signInWithGoogle}>Sign in with Google</button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
