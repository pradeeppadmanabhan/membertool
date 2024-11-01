import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get, update } from "firebase/database";
//import PrintApplication from "../utils/PrintApplication";
import Header from "../components/Header";
import sendEmail from "../utils/SendEmail";

const ApplicationDetails = () => {
  const { applicationKey } = useParams();
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // Add status message state

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const applicationRef = ref(database, `users/${applicationKey}`);
        const snapshot = await get(applicationRef);

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
  }, [applicationKey]);

  const handleStatusChange = async (status) => {
    // Function to handle both approval and rejection
    try {
      // Update application status in Firebase
      const applicationRef = ref(database, `users/${applicationKey}`);
      await update(
        applicationRef,
        {
          applicationStatus: status,
          approvedBy: "Admin User", // Replace with actual admin user details
          dateOfApproval: new Date().toISOString(),
        },
        () => {
          // Update applicationData after the update is complete
          setApplicationData({ ...applicationData, applicationStatus: status });
        }
      );

      // Prepare email data based on status
      let subject = "";
      let message = "";
      /* if (status === "Approved") {
        subject =
          "Congratulations! Your KMA Membership Application is Approved";
        message = `Dear ${applicationData.memberName},\n\nWe are pleased to inform you that your application for membership with the Karnataka Mountaineering Association has been approved.`;
      } else if (status === "Rejected") {
        subject = "KMA Membership Application Update";
        message = `Dear ${applicationData.memberName},\n\nWe regret to inform you that your application for membership with the Karnataka Mountaineering Association has been rejected.`;
      } else {
        console.error("Invalid application status:", status);
        return; // Don't proceed if status is invalid
      } */
      switch (status) {
        case "Approved":
          subject =
            "Congratulations! Your KMA Membership Application is Approved";
          message = `Dear ${applicationData.memberName},\n\nWe are pleased to inform you that your application for membership with the Karnataka Mountaineering Association has been approved.`;
          break;

        case "Rejected":
          subject = "KMA Membership Application Update";
          message = `Dear ${applicationData.memberName},\n\nWe regret to inform you that your application for membership with the Karnataka Mountaineering Association has been rejected.`;
          break;

        default:
          console.error("Invalid application status:", status);
          return; // Don't proceed if status is invalid
      }

      const emailData = {
        to_name: applicationData.memberName,
        to_email: applicationData.email,
        subject: subject,
        message: message,
      };

      // Send the email
      const emailSent = await sendEmail(emailData);
      if (emailSent) {
        console.log(`${status} email sent successfully!`);
        setStatusMessage(`Application ${status.toLowerCase()}ed successfully!`); // Set success message
      } else {
        console.error(`Failed to send ${status} email.`);
        setStatusMessage(`Failed to send ${status.toLowerCase()} email.`); // Set error message
      }

      // Navigate back to the list after 10 seconds
      setTimeout(() => {
        navigate(-1); // Go back to the previous page (ApplicationsList)
      }, 10000); // 10 seconds timeout
    } catch (error) {
      console.error(
        `Error ${
          status === "Approved" ? "approving" : "rejecting"
        } application:`,
        error
      );
      // Handle error (e.g., show an error message)
      setStatusMessage(`Error ${status.toLowerCase()}ing application.`); // Set error message
    }
  };

  const handleApprove = async () => {
    await handleStatusChange("Approved");
  };

  const handleReject = async () => {
    // Similar logic to handleApprove, but update applicationStatus to 'Rejected'
    await handleStatusChange("Rejected");
  };

  /* const handlePrintApplication = () => {
    PrintApplication(applicationData);
  }; */

  if (isLoading) {
    return <div>Loading application details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="application-details-container">
      <Header />
      <h2>Application Details</h2>
      <button onClick={() => navigate(-1)}>Back to List</button>{" "}
      {/* Back button */}
      <table className="application-details-table">
        <tbody>
          <tr>
            <td className="field-name">ID:</td>
            <td>{applicationData.id}</td>
          </tr>
          {/* ... Add other fields in the same way ... */}
          <tr>
            <td className="field-name">Name:</td>
            <td>{applicationData.memberName}</td>
          </tr>
          <tr>
            <td className="field-name">Date Of Birth:</td>
            <td>{applicationData.dob}</td>
          </tr>
          <tr>
            <td className="field-name">Gender:</td>
            <td>{applicationData.gender}</td>
          </tr>
          <tr>
            <td className="field-name">Name of Father / Guardian / Husband:</td>
            <td>{applicationData.fatherGuardianName}</td>
          </tr>
          <tr>
            <td className="field-name">Address Line1:</td>
            <td>{applicationData.addressLine1}</td>
          </tr>
          <tr>
            <td className="field-name">Address Line2:</td>
            <td>{applicationData.addressLine2}</td>
          </tr>
          <tr>
            <td className="field-name">Address Line3:</td>
            <td>{applicationData.addressLine3}</td>
          </tr>
          <tr>
            <td className="field-name">Landline:</td>
            <td>{applicationData.landline}</td>
          </tr>
          <tr>
            <td className="field-name">Mobile:</td>
            <td>{applicationData.mobile}</td>
          </tr>
          <tr>
            <td className="field-name">Email ID:</td>
            <td>{applicationData.email}</td>
          </tr>
          <tr>
            <td className="field-name">Academic Qualification:</td>
            <td>{applicationData.qualifications}</td>
          </tr>
          <tr>
            <td className="field-name">Profession:</td>
            <td>{applicationData.profession}</td>
          </tr>
          <tr>
            <td className="field-name">Athletic Background:</td>
            <td>{applicationData.athleticBackground}</td>
          </tr>
          <tr>
            <td className="field-name">Hobbies:</td>
            <td>{applicationData.hobbies}</td>
          </tr>
          <tr>
            <td className="field-name">History of serious illness:</td>
            <td>{applicationData.illnessHistory}</td>
          </tr>
          <tr>
            <td className="field-name">Present General Health:</td>
            <td>{applicationData.generalHealth}</td>
          </tr>
          <tr>
            <td className="field-name">Blood Group:</td>
            <td>{applicationData.bloodGroup}</td>
          </tr>
          <tr>
            <td className="field-name">Membership Type:</td>
            <td>{applicationData.membershipType}</td>
          </tr>
          <tr>
            <td className="field-name">Recommended By:</td>
            <td>{applicationData.recommendedByName}</td>
          </tr>
          <tr>
            <td className="field-name">Recommended By ID:</td>
            <td>{applicationData.recommendedByID}</td>
          </tr>
        </tbody>
      </table>
      {/* Admin Controls */}
      {applicationData.applicationStatus === "Submitted" && (
        <div className="admin-controls">
          <button onClick={handleApprove}>Approve</button>
          <button onClick={handleReject}>Reject</button>
        </div>
      )}
      {/* <div className="generate-pdf-button">
        <button onClick={handlePrintApplication}>Print Application</button>
      </div> */}
      {/* Display the status message */}
      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  );
};

export default ApplicationDetails;
