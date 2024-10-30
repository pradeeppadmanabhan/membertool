import React from "react";
import logo from "../KMALogo.png"; // Import your logo

const Header = () => {
  return (
    <div
      className="header-container"
      style={{
        // Inline styles for print layout
        "@media print": {
          width: "100%",
          marginBottom: "10px",
        },
      }}
    >
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
      <div
        className="header-text"
        style={{
          // Inline styles for print layout
          "@media print": {
            fontSize: "10px",
          },
        }}
      >
        {" "}
        {/* Add a container for the text */}
        <h1
          style={{
            // Inline styles for print layout
            "@media print": {
              fontSize: "12px",
            },
          }}
        >
          THE KARNATAKA MOUNTAINEERING ASSOCIATION (R)
        </h1>
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
