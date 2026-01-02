import React from "react";

const MaintenancePage = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>We'll be back soon!</h1>
      <p>
        The KMA Membership Management System is currently under maintenance.
        <br />
        For any urgent queries, please contact us at{" "}
        <a
          href="https://www.kmaindia.org/contact"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.kmaindia.org/contact
        </a>
        .
      </p>
      <p>Thank you for your patience!</p>
    </div>
  );
};

export default MaintenancePage;
