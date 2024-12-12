import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom"; // Import Link
import "../global.css"; // Import your CSS file

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filterType, setFilterType] = useState("all"); // Filter by type
  const [startDate, setStartDate] = useState(""); // State for start date
  const [endDate, setEndDate] = useState(""); // State for end date

  const [sortConfig, setSortConfig] = useState({
    key: "dateOfSubmission",
    direction: "descending",
  });

  useEffect(() => {
    const applicationsRef = ref(database, "users");

    onValue(
      applicationsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const applicationsArray = Object.entries(data).map(
            ([key, value]) => ({
              id: key,
              ...value,
            })
          );
          setApplications(applicationsArray);
        } else {
          console.error("No data found in the database.");
          setApplications([]);
        }
      },
      (error) => {
        console.error("Error fetching data:", error);
      }
    );
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
      //console.log(startDate, endDate);
      const submissionDate = new Date(application.dateOfSubmission);
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);

      const matchesDateRange =
        submissionDate >= filterStartDate && submissionDate <= filterEndDate;

      if (!matchesDateRange) {
        return false; // Exclude if outside the date range
      }
    }

    // Now apply the type filter
    const matchesType =
      filterType === "all" || application.currentMembershipType === filterType;
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
        <label htmlFor="dateFilter">Filter by Date:</label>
        <div>
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="endDate">End Date:</label>
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
            <th>Payment Mode</th>
            <th>Receipt No</th>
            <th>Transaction Reference</th>
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
              <td>{application.currentMembershipType}</td>
              <td>
                {application.dateOfSubmission &&
                application.dateOfSubmission !== "No Data" // Check for "No Data"
                  ? new Date(application.dateOfSubmission).toLocaleDateString()
                  : "--/--/----"}
              </td>
              <td>
                {application.payments && application.payments.length > 0
                  ? new Date(
                      application.payments[
                        application.payments.length - 1
                      ].dateOfPayment
                    ).toLocaleDateString()
                  : "--/--/----"}
              </td>
              {/* Format date */}
              {/* Add more cells for other data */}
              <td>
                {application.payments && application.payments.length > 0
                  ? application.payments[application.payments.length - 1]
                      .paymentMode
                  : "--"}
              </td>
              <td>
                {application.payments && application.payments.length > 0
                  ? application.payments[application.payments.length - 1]
                      .receiptNo
                  : "--"}
              </td>
              <td>
                {application.payments && application.payments.length > 0
                  ? application.payments[application.payments.length - 1]
                      .transactionReference
                  : "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationsList;
