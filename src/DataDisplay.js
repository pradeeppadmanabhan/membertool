// src/DataDisplay.js
import React, { useEffect, useState, useContext } from "react";
import { ref, onValue, off } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database } from "./firebase";
import "./global.css"; // Import your CSS file
import Header from "./components/Header";
import AuthContext, { auth } from "./AuthContext";

const DataDisplay = () => {
  const [data, setData] = useState(null);
  const [searchParams, setSearchParams] = useState({
    memberName: "", // Updated field name
    mobile: "", // Updated field name
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // To store the selected user for detailed view
  const [showNoUserMessage, setShowNoUserMessage] = useState(false); // New state for the message
  const [showMore, setShowMore] = useState(false);
  const { user } = useContext(AuthContext);

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

    /* onValue(dataRef, (snapshot) => {
      const fetchedData = snapshot.val();
      //console.log("Fetched data from Firebase:", fetchedData); // Log the fetched data
      setData(fetchedData);
    }); */
    // Function to fetch data
    const fetchData = () => {
      onValue(dataRef, (snapshot) => {
        const fetchedData = snapshot.val();
        setData(fetchedData);
      });
    };

    // Function to clear data
    const clearData = () => {
      setData(null); // Clear the data when the user logs out
      setFilteredUsers([]); // Clear the filtered users when the user logs out
      setSelectedUser(null); // Clear the selected user when the user logs out
      setShowNoUserMessage(false); // Clear the showNoUserMessage when the user logs out
    };

    // Fetch data when the user logs in
    if (user) {
      fetchData();
    } else {
      // Clear data when the user logs out
      clearData();
    }

    // Set up a listener to clear data when the user logs out
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        clearData();
        off(dataRef); // Detach the listener when the user logs out
      }
    });

    return () => {
      // Cleanup listener if necessary
      unsubscribeAuth();
      off(dataRef); // Detach the listener when the component unmounts
    };
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!user) {
      // Check if the user is logged in
      setShowNoUserMessage(true); // Show the "Please sign in" message
      return; // Don't proceed with the search
    }

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

  /* // Function to convert camelCase to regular text
  const camelCaseToText = (str) => {
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }; */

  // Helper function to display values, handling "No Data"
  const displayValue = (value) => {
    return value === "No Data" ? "" : value;
  };

  return (
    <form onSubmit={handleSearch}>
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
                    <p>
                      <strong>{displayValue(user.id)}</strong>
                    </p>
                    <p>{displayValue(user.mobile)} </p>
                    <p>{displayValue(user.email)} </p>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedUser ? (
            <div className="details-card">
              {/* Add a class for the details card */}
              {/* Display ID as the first row in bold */}
              <table className="application-details-table">
                <tbody>
                  <tr>
                    <td className="field-name">ID:</td>
                    <td>
                      <strong>{selectedUser.id}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="field-name">Name:</td>
                    <td>
                      <strong>{selectedUser.memberName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="field-name">Date Of Birth:</td>
                    <td>{selectedUser.dob}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Gender:</td>
                    <td>{selectedUser.gender}</td>
                  </tr>
                  <tr>
                    <td className="field-name">
                      Name of Father / Guardian / Husband:
                    </td>
                    <td>{selectedUser.fatherGuardianName}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Address Line1:</td>
                    <td>{selectedUser.addressLine1}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Address Line2:</td>
                    <td>{selectedUser.addressLine2}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Address Line3:</td>
                    <td>{selectedUser.addressLine3}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Landline:</td>
                    <td>{selectedUser.landline}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Mobile:</td>
                    <td>{selectedUser.mobile}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Email ID:</td>
                    <td>{selectedUser.email}</td>
                  </tr>
                </tbody>
              </table>
              {/* Show More/Less button */}
              <button onClick={() => setShowMore(!showMore)}>
                {showMore ? "Show Less" : "Show More"}
              </button>
              {/* Conditionally display additional details */}
              {showMore && (
                <div>
                  <table className="application-details-table">
                    <tbody>
                      <tr>
                        <td className="field-name">Academic Qualification:</td>
                        <td>{selectedUser.qualifications}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Profession:</td>
                        <td>{selectedUser.profession}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Athletic Background:</td>
                        <td>{selectedUser.athleticBackground}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Hobbies:</td>
                        <td>{selectedUser.hobbies}</td>
                      </tr>
                      <tr>
                        <td className="field-name">
                          History of serious illness:
                        </td>
                        <td>{selectedUser.illnessHistory}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Present General Health:</td>
                        <td>{selectedUser.generalHealth}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Blood Group:</td>
                        <td>{selectedUser.bloodGroup}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Membership Type:</td>
                        <td>{selectedUser.membershipType}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Recommended By:</td>
                        <td>{selectedUser.recommendedByName}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Recommended By ID:</td>
                        <td>{selectedUser.recommendedByID}</td>
                      </tr>
                      {selectedUser.membershipType === "Annual" && ( // Conditional rendering
                        <tr>
                          <td className="field-name">Renewal Due On:</td>
                          <td>{selectedUser.renewalDueOn}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="field-name">Transaction Detail:</td>
                        <td>{selectedUser.transactionDetail}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Receipt No:</td>
                        <td>{selectedUser.receiptNo}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Amount:</td>
                        <td>{selectedUser.amount}</td>
                      </tr>
                      <tr>
                        <td className="field-name">Approved By:</td>
                        <td>{selectedUser.approvedBy}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : showNoUserMessage && !user ? ( // Show message if no results AND user is not logged in
            <p>Please sign in to search for members.</p>
          ) : showNoUserMessage ? ( // Show the message only if showNoUserMessage is true
            <p>No user found.</p>
          ) : null}{" "}
          {/* Otherwise, show nothing */}
        </div>
      </div>
    </form>
  );
};

export default DataDisplay;
