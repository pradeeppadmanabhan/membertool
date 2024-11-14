import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom"; // Import Link
import DatePicker from "react-datepicker"; // Import the date picker
import "react-datepicker/dist/react-datepicker.css";
import "../global.css"; // Import your CSS file

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filterType, setFilterType] = useState("all"); // Filter by type
  const [startDate, setStartDate] = useState(null); // State for start date
  const [endDate, setEndDate] = useState(null); // State for end date

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
    if (startDate && endDate) {
      // Check if dates are selected
      const submissionDate = new Date(application.dateOfSubmission);
      const matchesDateRange =
        submissionDate >= startDate && submissionDate <= endDate;

      if (!matchesDateRange) {
        return false; // Exclude if outside the date range
      }
    }

    // Now apply the type filter
    const matchesType =
      filterType === "all" || application.membershipType === filterType;
    return matchesType;
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

      <div>
        <label htmlFor="typeFilter">Filter by Membership Type:</label>
        <select
          id="typeFilter"
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Annual">Annual</option>
          <option value="Life">Life</option>
          <option value="Honorary">Honorary</option>
        </select>
      </div>

      {/* Date Range Picker */}
      <div className="date-range-picker">
        <br />
        <label htmlFor="dateFilter">Filter by Month:</label>
        <div>
          <label htmlFor="startDate">Start Month:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="endDate">End Month:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Membership Type</th>
            <th onClick={() => requestSort("dateOfSubmission")}>
              Date of Submission
              {sortConfig.key === "dateOfSubmission" && (
                <span>{sortConfig.direction === "ascending" ? "▲" : "▼"}</span>
              )}
            </th>
            <th onClick={() => requestSort("dateOfPayment")}>
              {/* New header */}
              Date of Last Payment
              {sortConfig.key === "dateOfPayment" && (
                <span>{sortConfig.direction === "ascending" ? "▲" : "▼"}</span>
              )}
            </th>
            {/* Add more columns as needed */}
          </tr>
        </thead>
        <tbody>
          {sortedApplications.map((application) => (
            <tr key={application.id}>
              {/* console.log("Application ID:", application.id) */}
              {/* Use key from the database */}
              <td>
                <Link to={`/admin/application/${application.id}`}>
                  {application.id}
                </Link>
              </td>
              <td>{application.memberName}</td>
              <td>{application.membershipType}</td>
              <td>
                {application.dateOfSubmission &&
                application.dateOfSubmission !== "No Data" // Check for "No Data"
                  ? new Date(application.dateOfSubmission).toLocaleDateString()
                  : "--/--/----"}
              </td>
              <td>
                {/* Updated cell */}
                {application.dateOfPayment &&
                application.dateOfPayment !== "No Data"
                  ? new Date(application.dateOfPayment).toLocaleDateString()
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
