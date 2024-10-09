// src/DataDisplay.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";

const DataDisplay = () => {
  const [data, setData] = useState(null);
  const [searchParams, setSearchParams] = useState({
    firstname: "",
    lastname: "",
    phonenumber: "",
  });
  const [filteredUser, setFilteredUser] = useState(null);

  useEffect(() => {
    const dataRef = ref(database, "users"); // Adjust the path as necessary
    onValue(dataRef, (snapshot) => {
      const fetchedData = snapshot.val();
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
      const result = Object.values(data).find((user) => {
        return (
          (searchParams.firstname &&
            user.firstname === searchParams.firstname &&
            user.lastname === searchParams.lastname) ||
          (searchParams.firstname &&
            user.firstname === searchParams.firstname &&
            user.phonenumber === searchParams.phonenumber)
        );
      });
      setFilteredUser(result || null);
    }
  };

  return (
    <div>
      <h1>User Data</h1>
      <div>
        <input
          type="text"
          name="firstname"
          placeholder="First Name"
          value={searchParams.firstname}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastname"
          placeholder="Last Name"
          value={searchParams.lastname}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phonenumber"
          placeholder="Phone Number"
          value={searchParams.phonenumber}
          onChange={handleChange}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {filteredUser ? (
        <div>
          <h2>User ID: {filteredUser.id}</h2>
          <p>First Name: {filteredUser.firstname || "N/A"}</p>
          <p>Last Name: {filteredUser.lastname || "N/A"}</p>
          <p>Phone Number: {filteredUser.phonenumber || "N/A"}</p>
          <p>Email: {filteredUser.email}</p>
          <p>Date of Enrollment: {filteredUser.dateOfEnrollment}</p>
          <p>Life Member: {filteredUser.isLifeMember ? "Yes" : "No"}</p>
          <p>
            Membership Active: {filteredUser.isMembershipActive ? "Yes" : "No"}
          </p>
        </div>
      ) : (
        <p>No user found or enter search parameters.</p>
      )}
    </div>
  );
};

export default DataDisplay;
