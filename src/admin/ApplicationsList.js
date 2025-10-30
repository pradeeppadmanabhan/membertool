import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom"; // Import Link
import "../global.css"; // Import your CSS file
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

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
      /* 
    // Custom sorting logic for receiptNumber
  
    const valueA =
      sortConfig.key === "receiptNumber" && a.payments && a.payments.length > 0
        ? a.payments[a.payments.length - 1].receiptNumber
        : a[sortConfig.key];
    const valueB =
      sortConfig.key === "receiptNumber" && b.payments && b.payments.length > 0
        ? b.payments[b.payments.length - 1].receiptNumber
        : b[sortConfig.key];
    console.log(
      "Sorting by:",
      sortConfig.key,
      "Direction:",
      sortConfig.direction
    );
    console.log("Value A:", valueA, "Value B:", valueB);
    if (valueA === "No Data") return 1; // Push "No Data" to the end
    if (valueB === "No Data") return -1; // Push "No Data" to the end
    if (valueA === undefined) return 1; // Handle undefined values
    if (valueB === undefined) return -1; // Handle undefined values
    if (valueA === null) return 1; // Handle null values
    if (valueB === null) return -1;
    // Compare values based on the sort direction
    if (sortConfig.direction === "ascending") {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    } */
    });

  const downloadExcel = () => {
    if (filteredApplications.length === 0) {
      toast.error("No data to download.");
      return;
    }

    try {
      // Generate file name with local timestamp
      const timestamp = format(new Date(), "yyyyMMdd'T'HHmmss"); // Local time
      const fileName = `MembersList_${timestamp}.xlsx`;

      // Convert data to worksheet
      const worksheetData = filteredApplications.map((application) => ({
        ID: application.id,
        Name: application.memberName,
        Email: application.email,
        Mobile: application.mobile,
        "Membership Type": application.currentMembershipType,
        "Date of Submission": application.dateOfSubmission
          ? new Date(application.dateOfSubmission).toLocaleDateString()
          : "--/--/----",
        "Date of Last Payment":
          application.payments && application.payments.length > 0
            ? new Date(
                application.payments[
                  application.payments.length - 1
                ].dateOfPayment
              ).toLocaleDateString()
            : "--/--/----",
        "Receipt Number":
          application.payments && application.payments.length > 0
            ? application.payments[application.payments.length - 1]
                .receiptNumber
            : "--",
        "Payment Mode":
          application.payments && application.payments.length > 0
            ? application.payments[application.payments.length - 1].paymentMode
            : "--",
        "Payment ID":
          application.payments && application.payments.length > 0
            ? application.payments[application.payments.length - 1].paymentID
            : "--",
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

      // Write workbook to file
      XLSX.writeFile(workbook, fileName);

      // Show success toast message
      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Error generating Excel file:", error);
      toast.error(
        "An error occurred while generating the Excel file. Please try again."
      );
    }
  };

  return (
    <div className="mt-5">
      <h2>List of Applications</h2>

      {/* Filter Controls */}

      <div className="filter-container">
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

        <div className="date-range-container">
          <label htmlFor="dateFilter">Filter by Date:</label>
          <div className="date-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="download-container">
        <button onClick={downloadExcel}>Download as Excel</button>
      </div>
      {/* Toast Container */}
      <ToastContainer />

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
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

            {/* <th onClick={() => requestSort("receiptNumber")}>
              Receipt No
              {sortConfig.key === "receiptNumber" && (
                <span>{sortConfig.direction === "ascending" ? "▲" : "▼"}</span>
              )}
            </th> */}
            <th>Receipt No</th>
            <th>Payment Mode</th>
            <th>Payment ID</th>
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
              <td>{application.email}</td>
              <td>{application.mobile}</td>
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
                      .receiptNumber
                  : "--"}
              </td>
              <td>
                {application.payments && application.payments.length > 0
                  ? application.payments[application.payments.length - 1]
                      .paymentMode
                  : "--"}
              </td>
              <td>
                {application.payments && application.payments.length > 0
                  ? application.payments[application.payments.length - 1]
                      .paymentID
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
