import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { Link } from "react-router-dom"; // Import Link
import "../global.css"; // Import your CSS file
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { formatDate } from "../utils/DateUtils";
import sendEmail from "../utils/SendEmail";
import { isEligibleForLifeMembership } from "../utils/EligibilityUtils";
import {
  prepareRenewalReminderEmail,
  prepareLifeMembershipInvitationEmail,
} from "../utils/EmailUtils";

const ApplicationsList = () => {
  const TOAST_DISPLAY_DURATION = 2000; // Duration to display toast messages (in milliseconds)

  const [applications, setApplications] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null); // State to track email status
  const [sentInvites, setSentInvites] = useState([]); // Array to track sent invites
  const [filterType, setFilterType] = useState("all"); // Filter by type
  const [renewalFilter, setRenewalFilter] = useState("all"); // Filter by renewal status

  const formatDateSafe = (dateValue) => {
    return formatDate(dateValue);
  };
  const [startDate, setStartDate] = useState(""); // State for start date
  const [endDate, setEndDate] = useState(""); // State for end date
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [sortConfig, setSortConfig] = useState({
    key: "dateOfSubmission",
    direction: "descending",
  });

  useEffect(() => {
    const applicationsRef = ref(database, "users");

    const unsubscribe = onValue(
      applicationsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const today = new Date();
          const applicationsArray = Object.entries(data).map(([key, value]) => {
            // Calculate renewal status for Annual members
            let renewalStatus = "N/A";
            if (
              value.currentMembershipType === "Annual" &&
              value.renewalDueOn
            ) {
              const renewalDate = new Date(value.renewalDueOn);
              renewalStatus = renewalDate <= today ? "Due" : "Active";

              // Update Firebase applicationStatus to "Due" if renewal is due
              if (renewalStatus === "Due") {
                const userRef = ref(database, `users/${key}`);
                update(userRef, { applicationStatus: "Due" }).catch((err) =>
                  console.error("Error updating applicationStatus:", err),
                );
              }
            }

            return {
              id: key,
              ...value,
              renewalStatus,
            };
          });
          setApplications(applicationsArray);
        } else {
          console.error("No data found in the database.");
          setApplications([]);
        }
      },
      (error) => {
        console.error("Error fetching data:", error);
      },
    );

    // Cleanup function to unsubscribe the listener
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendReminder = async (user) => {
    const toastId = toast.info(`Sending reminder to ${user.memberName}...`, {
      autoClose: false, // Keep the toast open until updated
    });

    try {
      if (!user.renewalDueOn || isNaN(new Date(user.renewalDueOn).getTime())) {
        toast.update(toastId, {
          render: `${user.memberName} has an invalid renewal date.`,
          type: "error",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.error(`${user.memberName} has an invalid renewal date.`);
        return;
      }
      const today = new Date();
      const dueDate = new Date(user.renewalDueOn);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

      const { subject, message } = prepareRenewalReminderEmail(user, daysDiff);

      // Prepare email data
      const emailData = {
        to_name: user.memberName,
        to_email: user.email,
        subject: subject,
        message: message,
        contentType: "text/html",
      };

      const success = await sendEmail(emailData);

      if (success) {
        toast.update(toastId, {
          render: `Reminder email sent to ${user.memberName}!`,
          type: "success",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.log("Reminder email sent successfully!");
      } else {
        toast.update(toastId, {
          render: `Failed to send reminder email to ${user.memberName}.`,
          type: "error",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.error("Failed to send reminder email.");
      }
    } catch (error) {
      toast.update(toastId, {
        render: `Error sending reminder email to ${user.memberName}: ${error.message}`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error("Error sending reminder:", error);
    }
  };

  const handleElevateToLifeMember = async (user) => {
    const toastId = toast.info(
      `Processing life membership invitation for ${user.memberName}...`,
      {
        autoClose: false, // Keep the toast open until updated
      },
    );

    if (
      !user.dateOfSubmission ||
      isNaN(new Date(user.dateOfSubmission).getTime())
    ) {
      toast.update(toastId, {
        render: `${user.memberName} has an invalid joining date.`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error(`${user.memberName} has an invalid joining date.`);
      return;
    }

    if (!isEligibleForLifeMembership(new Date(user.dateOfSubmission))) {
      toast.update(toastId, {
        render: `${user.memberName} is not eligible for Life Membership.`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error(`${user.memberName} is not eligible for Life Membership.`);
      return;
    }

    try {
      try {
        // Update isUpgradeAllowed flag in the database
        const userRef = ref(database, `users/${user.id}`);
        await update(userRef, { isUpgradeAllowed: true });
      } catch (err) {
        console.error("Error updating isUpgradeAllowed flag:", err);
      }

      // 1. Prepare email content
      const { subject, message } = prepareLifeMembershipInvitationEmail(user);

      // 2. Prepare email metadata
      const emailData = {
        to_name: user.memberName,
        to_email: user.email,
        subject: subject,
        message: message,
        contentType: "text/html",
      };

      // 3. Send the email
      const success = await sendEmail(emailData);

      if (success) {
        toast.update(toastId, {
          render: `Life membership invitation email sent to ${user.memberName}!`,
          type: "success",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.log("Life membership invitation email sent successfully!");
        setEmailStatus(`Invitation sent successfully to ${user.memberName}!`);
        setSentInvites([...sentInvites, user.id]);
      } else {
        toast.update(toastId, {
          render: `Failed to send life membership invitation email to ${user.memberName}.`,
          type: "error",
          autoClose: TOAST_DISPLAY_DURATION,
        });
        console.error("Failed to send life membership invitation email.");
        setEmailStatus(`Failed to send invitation to ${user.memberName}.`);
      }

      // Set a timeout to clear the emailStatus after displaying duration
      setTimeout(() => {
        setEmailStatus(null);
      }, TOAST_DISPLAY_DURATION);
    } catch (error) {
      toast.update(toastId, {
        render: `Error sending life membership invitation email to ${user.memberName}: ${error.message}`,
        type: "error",
        autoClose: TOAST_DISPLAY_DURATION,
      });
      console.error("Error sending life membership invitation:", error);
      setEmailStatus(
        `Error sending invitation to ${user.memberName}, due to ${error.message}`,
      );
    }
  };

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

    // Apply renewal status filter
    const matchesRenewalStatus =
      renewalFilter === "all" || application.renewalStatus === renewalFilter;

    // Filter by search query (name, mobile, email)
    const matchesSearchQuery =
      application.memberName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      application.mobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesRenewalStatus && matchesSearchQuery;
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
    if (sortedApplications.length === 0) {
      toast.error("No data to download.");
      return;
    }

    try {
      // Generate file name with local timestamp
      const timestamp = format(new Date(), "yyyyMMdd'T'HHmmss"); // Local time
      const renewalSuffix = renewalFilter !== "all" ? `_${renewalFilter}` : "";
      const fileName = `MembersList${renewalSuffix}_${timestamp}.xlsx`;

      // Convert sorted data to worksheet
      const worksheetData = sortedApplications.map((application) => ({
        ID: application.id,
        Name: application.memberName,
        Email: application.email,
        Mobile: application.mobile,
        "Membership Type": application.currentMembershipType,
        "Date of Submission": application.dateOfSubmission
          ? formatDate(application.dateOfSubmission)
          : "--/--/----",
        "Date of Last Payment":
          application.payments && application.payments.length > 0
            ? formatDate(
                application.payments[application.payments.length - 1]
                  .dateOfPayment,
              )
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
        "Renewal Due On":
          application.currentMembershipType !== "Annual"
            ? "N/A"
            : formatDateSafe(application.renewalDueOn),
        "Renewal Status":
          application.currentMembershipType !== "Annual"
            ? "N/A"
            : application.renewalStatus || "N/A",
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
        "An error occurred while generating the Excel file. Please try again.",
      );
    }
  };

  return (
    <div className="mt-5">
      <h2>Member Directory</h2>

      {/* Filter Controls */}
      <div className="filters-container">
        <div className="filter-container">
          <label htmlFor="typeFilter">Filter by Membership Type:</label>
          <select
            id="typeFilter"
            className="filter-select"
            value={filterType}
            onChange={(e) => {
              const selectedType = e.target.value;
              setFilterType(selectedType);
              if (selectedType !== "Annual") {
                setRenewalFilter("all");
              }
            }}
          >
            <option value="all">All</option>
            <option value="Annual">Annual</option>
            <option value="Life">Life</option>
            <option value="Honorary">Honorary</option>
          </select>
        </div>

        <div className="filter-container">
          <label htmlFor="renewalFilter">Filter by Renewal Status:</label>
          <select
            id="renewalFilter"
            className="filter-select"
            value={renewalFilter}
            onChange={(e) => setRenewalFilter(e.target.value)}
            disabled={filterType !== "Annual"}
          >
            <option value="all">All</option>
            <option value="Due">Due</option>
            <option value="Active">Active</option>
            <option value="N/A">N/A</option>
          </select>
        </div>

        <div className="date-full-row">
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

        <div className="filter-result-count">
          Showing {sortedApplications.length} result
          {sortedApplications.length === 1 ? "" : "s"}.
        </div>
      </div>

      {/* Search Filter */}
      <div className="search-container">
        <label htmlFor="searchQuery">Search by Name, Mobile, or Email:</label>
        <input
          type="text"
          id="searchQuery"
          placeholder="Enter name, mobile, or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="download-container">
        <button onClick={downloadExcel}>Download as Excel</button>
      </div>
      {/* Toast Container */}
      <ToastContainer />

      {/* Display email status message */}
      {emailStatus && (
        <p
          className={`status-message ${
            emailStatus.includes("Failed") ? "error" : ""
          }`}
        >
          {emailStatus}
        </p>
      )}

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
            <th>Renewal Due On</th>
            <th>Renewal Status</th>
            <th>Send Reminder</th>
            <th>Send Invite</th>
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
                  ? formatDate(application.dateOfSubmission)
                  : "--/--/----"}
              </td>
              <td>
                {application.payments && application.payments.length > 0
                  ? formatDate(
                      application.payments[application.payments.length - 1]
                        .dateOfPayment,
                    )
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
              <td>
                {application.currentMembershipType !== "Annual"
                  ? "N/A"
                  : formatDateSafe(application.renewalDueOn)}
              </td>
              <td>
                {application.currentMembershipType !== "Annual"
                  ? "N/A"
                  : application.renewalStatus || "N/A"}
              </td>
              <td>
                <button
                  onClick={() => handleSendReminder(application)}
                  disabled={
                    application.currentMembershipType !== "Annual" ||
                    application.renewalStatus !== "Due"
                  }
                >
                  Send Reminder
                </button>
              </td>
              <td>
                <button
                  onClick={() => handleElevateToLifeMember(application)}
                  disabled={
                    application.currentMembershipType !== "Annual" ||
                    !isEligibleForLifeMembership(
                      new Date(application.dateOfSubmission),
                    )
                  }
                  className={
                    sentInvites.includes(application.id)
                      ? "invite-sent-button"
                      : ""
                  }
                >
                  Send Invite
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationsList;
