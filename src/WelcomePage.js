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
        <h2>Welcome to</h2>
        <h1>The Karnataka Mountaineering Association</h1>
        <p>Your gateway to adventure, fitness, and the majestic mountains.</p>
        <div>
          <button onClick={signInWithGoogle}>Sign in with Google</button>
        </div>
      </div>
      <br />
      <br />
      <br />
      <br />
      <div className="footer">
        <p>
          <i>
            Best viewed in a modern browser like Chrome, Firefox, or Edge on
            Laptop or Desktop.
          </i>
        </p>
        {/* <p>
          By signing in, you agree to our{" "}
          <a href="/terms-of-service">Terms of Service</a> and{" "}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p> */}
        <p>
          We are in "Beta mode". If you find any issues, please contact us at{" "}
          <a href="mailto:info@kmaindia.org">info@kmaindia.org</a>.
        </p>
        <p>
          © {new Date().getFullYear()} Karnataka Mountaineering Association. All
          rights reserved.
        </p>
        <p>
          <a href="https://kmaindia.org">Visit our website</a>
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
