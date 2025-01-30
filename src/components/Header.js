import React from "react";
import logo from "../KMALogo.png"; // Import your logo
import "../global.css";

const Header = () => {
  return (
    <div className="header-container">
      <img src={logo} alt="KMA Logo" className="logo-image" />
      <div className="header-text">
        <h1>THE KARNATAKA MOUNTAINEERING ASSOCIATION (R)</h1>
        <p>
          Room No 205, I Floor, Kanteerava Sports Complex – 2, Kanteerava
          Stadium premises, Kasturba Road, Bangalore – 560 001
        </p>
        <p>T: +91 80 22113333 E: info@kmaindia.org</p>
        <p>W: www.kmaindia.org FB: www.facebook.com\kmaindia</p>
      </div>
    </div>
  );
};

export default Header;
