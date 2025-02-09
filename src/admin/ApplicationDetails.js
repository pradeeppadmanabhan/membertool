import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import UserProfile from "../utils/UserProfile";
import "../global.css"; // Import your CSS file

const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const applicationRef = ref(database, `users/${applicationId}`);
        const snapshot = await get(applicationRef);

        //console.log("looking for application id: users/", applicationId);
        //console.log("Snapshot Data:", snapshot.val());

        if (snapshot.exists()) {
          setApplicationData(snapshot.val());
        } else {
          setError("Application not found.");
        }
      } catch (error) {
        console.error("Error fetching application data:", error);
        setError("Failed to fetch application details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationData();
  }, [applicationId]);

  if (isLoading) {
    return <div>Loading application details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="mt-5">
      <h2>Application Details</h2>
      <button onClick={() => navigate(-1)}>Back to List</button>{" "}
      {/* Back button */}
      <br />
      <br />
      <UserProfile userData={applicationData} />
    </div>
  );
};

export default ApplicationDetails;
