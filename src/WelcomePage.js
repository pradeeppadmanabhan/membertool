import React from "react";
import "./WelcomePage.css";
import { Link } from "react-router-dom";
import logo from "./KMALogo.png"; // Import your logo

const WelcomePage = () => {
  return (
    <div className="welcome-page">
      <div className="content">
        <img
          src={logo}
          alt="KMA Logo"
          className="logo-image"
          style={{
            // Inline styles for print layout
            "@media print": {
              height: "25px",
              marginRight: "10px",
            },
          }}
        />
        <h1>Welcome to the Karnataka Mountaineering Association</h1>
        <p>Your gateway to adventure, fitness, and the majestic mountains.</p>
        <Link to="/new-application" className="btn">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
