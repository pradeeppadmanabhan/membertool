import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom"; // Import Link

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Submitted");
  const [sortConfig, setSortConfig] = useState({
    key: "dateOfSubmission",
    direction: "descending",
  });

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

  // Sorting Logic
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredApplications = applications.filter((application) => {
    if (filterStatus === "all") {
      return true;
    } else {
      return application.applicationStatus === filterStatus;
    }
  });

  const sortedApplications = [...filteredApplications]
    .sort((a, b) => {
      const dateA =
        a[sortConfig.key] && a[sortConfig.key] !== "No Data"
          ? new Date(a[sortConfig.key])
          : new Date(0); // Use 0 for "No Data" to push them to the end
      const dateB =
        b[sortConfig.key] && b[sortConfig.key] !== "No Data"
          ? new Date(b[sortConfig.key])
          : new Date(0);

      if (sortConfig.direction === "ascending") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    })
    .sort((a, b) => {
      // Second sort to handle "No Data" placement
      const aNoData = a[sortConfig.key] === "No Data";
      const bNoData = b[sortConfig.key] === "No Data";

      if (aNoData && !bNoData) {
        return 1; // Push "No Data" to the end
      } else if (!aNoData && bNoData) {
        return -1;
      } else {
        return 0;
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
        <option value="Rejected">Rejected</option>
        <option value="Paid">Paid</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th onClick={() => requestSort("dateOfSubmission")}>
              Date of Submission{" "}
              {sortConfig.key === "dateOfSubmission" && (
                <span>{sortConfig.direction === "ascending" ? "▲" : "▼"}</span>
              )}
            </th>
            <th>Date of Approval</th>
            {/* Add more columns as needed */}
          </tr>
        </thead>
        <tbody>
          {sortedApplications.map((application) => (
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
              <td>{application.applicationStatus}</td>
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
