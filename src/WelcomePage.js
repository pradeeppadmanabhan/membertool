import React from "react";
import "./WelcomePage.css";
import { Link } from "react-router-dom";

const WelcomePage = () => {
  return (
    <div className="welcome-page">
      <div className="content">
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
