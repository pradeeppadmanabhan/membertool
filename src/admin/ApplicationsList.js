import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom"; // Import Link

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Submitted");

  useEffect(() => {
    const applicationsRef = ref(database, "users");

    onValue(applicationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const applicationsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setApplications(applicationsArray);
      }
    });
  }, []);

  const filteredApplications = applications.filter((application) => {
    if (filterStatus === "all") {
      return true;
    } else {
      return application.applicationStatus === filterStatus;
    }
  });

  return (
    <div>
      <h2>List of Applications</h2>

      {/* Filter Controls */}
      <label htmlFor="statusFilter">Filter by Status:</label>
      <select
        id="statusFilter"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All</option>
        <option value="Submitted">Submitted</option>
        <option value="Approved">Approved</option>
        <option value="Paid">Paid</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Date of Submission</th> {/* New column */}
            <th>Date of Approval</th> {/* New column */}
            {/* Add more columns as needed */}
          </tr>
        </thead>
        <tbody>
          {filteredApplications.map((application) => (
            <tr key={application.key}>
              {console.log("Application Key:", application.key)}
              {console.log("Application ID:", application.id)}
              {/* Use key from the database */}
              <td>
                <Link to={`/admin/application/${application.key}`}>
                  {application.id}
                </Link>
              </td>
              <td>{application.memberName}</td>
              <td>{application.applicationStatus}</td>{" "}
              {/* No more optional chaining */}
              <td>
                {application.dateOfSubmission &&
                application.dateOfSubmission !== "No Data" // Check for "No Data"
                  ? new Date(application.dateOfSubmission).toLocaleDateString()
                  : "--/--/----"}
              </td>
              <td>
                {application.dateOfApproval &&
                application.dateOfApproval !== "No Data" // Check for "No Data"
                  ? new Date(application.dateOfApproval).toLocaleDateString()
                  : "--/--/----"}
              </td>
              {/* Format date */}
              {/* Add more cells for other data */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationsList;
