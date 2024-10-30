// src/Admin/RenewalDueList.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import "../global.css"; // Import your CSS file

const RenewalDueList = () => {
  const [membersDue, setMembersDue] = useState([]);

  useEffect(() => {
    const dataRef = ref(database, "users");

    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1); // Get last month's date

        const dueMembers = Object.values(data).filter((user) => {
          if (user.membershipType !== "Annual") {
            return false;
          }

          const renewalDate = new Date(user.renewalDueOn);
          // Check if renewal is due within the next month OR within the past month
          return (
            (renewalDate >= today && renewalDate < nextMonth) ||
            (renewalDate >= lastMonth && renewalDate < today)
          );
        });

        // Calculate renewal status for each member
        const membersWithStatus = dueMembers.map((user) => {
          const renewalDate = new Date(user.renewalDueOn);
          let renewalStatus = "Due"; // Default status

          if (renewalDate < today) {
            renewalStatus = "Pending"; // Within grace period (past month)
          }
          if (renewalDate < lastMonth) {
            renewalStatus = "Not Renewed"; // Beyond grace period
          }

          return { ...user, renewalStatus }; // Add renewalStatus to user object
        });

        setMembersDue(membersWithStatus);
      }
    });
  }, []);

  return (
    <div>
      <h2>Members Due for Renewal</h2>
      {membersDue.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Renewal Due On</th>
              <th>Renewal Status</th> {/* New column */}
            </tr>
          </thead>
          <tbody>
            {membersDue.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.memberName}</td>
                <td>{user.email}</td>
                <td>{user.mobile}</td>
                <td>{new Date(user.renewalDueOn).toLocaleDateString()}</td>
                <td>{user.renewalStatus}</td> {/* Display renewal status */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No members due for renewal.</p>
      )}
    </div>
  );
};

export default RenewalDueList;
