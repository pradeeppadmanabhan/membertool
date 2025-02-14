import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserProfile from "../utils/UserProfile";
import "../global.css"; // Import your CSS file

const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="mt-5">
      <h2>Application Details</h2>
      <button onClick={() => navigate(-1)}>Back to List</button>{" "}
      {/* Back button */}
      <br />
      <br />
      <UserProfile memberID={applicationId} />
    </div>
  );
};

export default ApplicationDetails;
