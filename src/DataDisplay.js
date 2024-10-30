// src/DataDisplay.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
import "./global.css"; // Import your CSS file
import Header from "./components/Header";

const DataDisplay = () => {
  const [data, setData] = useState(null);
  const [searchParams, setSearchParams] = useState({
    memberName: "", // Updated field name
    //id: "", // Updated field name
    mobile: "", // Updated field name
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // To store the selected user for detailed view
  const [showNoUserMessage, setShowNoUserMessage] = useState(false); // New state for the message
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const dataRef = ref(database, "users"); // Adjust the path as necessary

    // Check for connection status
    const connectedRef = ref(database, ".info/connected");
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        console.log("Firebase connection is established.");
      } else {
        console.error("Firebase connection is lost or not established.");
      }
    });

    onValue(dataRef, (snapshot) => {
      const fetchedData = snapshot.val();
      //console.log("Fetched data from Firebase:", fetchedData); // Log the fetched data
      setData(fetchedData);
    });

    return () => {
      // Cleanup listener if necessary
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    if (data) {
      const results = Object.values(data).filter((user) => {
        // Filter users based on search criteria
        //console.log("User:", user); // Log the user object
        //console.log("Search Params:", searchParams); // Log the search parameters)
        return (
          (searchParams.memberName &&
            user.memberName
              ?.toLowerCase()
              ?.includes(searchParams.memberName.toLowerCase())) ||
          (searchParams.mobile && user.mobile.includes(searchParams.mobile))
        );
      });
      setFilteredUsers(results);
      setShowNoUserMessage(results.length === 0);
      setSelectedUser(null); // Clear selected user when performing a new search
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleClear = () => {
    setSearchParams({
      memberName: "",
      mobile: "",
    });
    setFilteredUsers([]); // Clear the filtered users array
    setSelectedUser(null); // Reset selectedUser to clear the detailed view
  };

  // Function to convert camelCase to regular text
  const camelCaseToText = (str) => {
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Helper function to display values, handling "No Data"
  const displayValue = (value) => {
    return value === "No Data" ? "" : value;
  };

  return (
    <div className="search-container">
      <Header />
      <h1>Search Member Details</h1>
      <div>
        <input
          type="text"
          name="memberName" // Updated field name
          placeholder="Member Name"
          value={searchParams.memberName}
          onChange={handleChange}
        />
        <p>or</p>
        <input
          type="text"
          name="mobile" // Updated field name
          placeholder="Mobile"
          value={searchParams.mobile}
          onChange={handleChange}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={handleClear}>Clear</button>
      </div>
      <div className="search-results">
        {" "}
        {/* Add a container for search results */}
        {filteredUsers.length > 0 && !selectedUser ? ( // Show the list only if there are filtered users and no user is selected
          <div className="card-container">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="member-card"
                onClick={() => handleUserClick(user)}
              >
                <div className="card-content">
                  <h3>{displayValue(user.memberName)}</h3>
                  <p>{displayValue(user.mobile)} </p>
                </div>
              </div>
            ))}
          </div>
        ) : selectedUser ? (
          <div className="details-card">
            {" "}
            {/* Add a class for the details card */}
            {/* Display ID as the first row in bold */}
            <p>
              <strong>ID: {selectedUser.id}</strong>
            </p>
            {/* Display key fields */}
            <p>
              {camelCaseToText("memberName")}:{" "}
              {displayValue(selectedUser.memberName)}
            </p>
            <p>
              {camelCaseToText("membershipType")}:{" "}
              {displayValue(selectedUser.membershipType)}
            </p>
            <p>Mobile: {displayValue(selectedUser.mobile)}</p>
            <p>Landline: {displayValue(selectedUser.landline)}</p>
            <p>Email: {displayValue(selectedUser.email)}</p>
            <p>Address Line 1: {displayValue(selectedUser.addressLine1)}</p>
            <p>Address Line 2: {displayValue(selectedUser.addressLine2)}</p>
            <p>Address Line 3: {displayValue(selectedUser.addressLine3)}</p>
            <p>
              {camelCaseToText("bloodGroup")}:{" "}
              {displayValue(selectedUser.bloodGroup)}
            </p>
            <p>Year of Joining: {displayValue(selectedUser.year)}</p>
            {/* Show More/Less button */}
            <button onClick={() => setShowMore(!showMore)}>
              {showMore ? "Show Less" : "Show More"}
            </button>
            {/* Conditionally display additional details */}
            {showMore && (
              <div>
                {Object.entries(selectedUser)
                  .filter(
                    ([key]) =>
                      ![
                        "id",
                        "memberName",
                        "membershipType",
                        "mobile",
                        "landline",
                        "email",
                        "addressLine1",
                        "addressLine2",
                        "addressLine3",
                        "bloodGroup",
                        "year",
                      ].includes(key)
                  )
                  .map(([key, value]) => (
                    <p key={key}>
                      {camelCaseToText(key)}: {displayValue(value)}
                    </p>
                  ))}
              </div>
            )}
          </div>
        ) : showNoUserMessage ? ( // Show the message only if showNoUserMessage is true
          <p>No user found.</p>
        ) : null}{" "}
        {/* Otherwise, show nothing */}
      </div>
    </div>
  );
};

export default DataDisplay;
