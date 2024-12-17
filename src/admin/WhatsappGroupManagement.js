// src/admin/WhatsappGroupManagement.js
import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../firebase";
import "../global.css";

const WhatsappGroupManagement = () => {
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataRef = ref(database, "users");

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const membersArray = Object.values(data);

        // Update whatsappGroupStatus based on renewalDueOn
        const today = new Date();
        const membersWithStatus = membersArray.map((member) => {
          if (member.renewalDueOn) {
            const renewalDate = new Date(member.renewalDueOn);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);

            if (
              member.currentMembershipType === "Annual" &&
              renewalDate < oneMonthAgo &&
              member.whatsappGroupStatus !== "Removed"
            ) {
              return { ...member, whatsappGroupStatus: "Remove" };
            }
          }
          return member;
        });

        setAllMembers(membersWithStatus);
        setLoading(false);
      } else {
        setAllMembers([]);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);

  const handleStatusChange = async (member, group) => {
    let newStatus;

    if (member.whatsappGroupStatus === "Add") {
      newStatus = "Added";
    } else if (member.whatsappGroupStatus === "Added") {
      newStatus = "Remove";
    } else if (member.whatsappGroupStatus === "Remove") {
      newStatus = "Removed";
    } else {
      newStatus = "Add"; // for Removed -> Add transition
    }

    try {
      await update(ref(database, `users/${member.id}`), {
        whatsappGroupStatus: newStatus,
      });

      setAllMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === member.id ? { ...m, whatsappGroupStatus: newStatus } : m
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      // Handle error, e.g., show a message to the user
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Filter members *before* assigning to lifeMembers and annualMembers
  const filteredMembers = allMembers.filter(
    (member) =>
      (member.whatsappGroupStatus === "Add" ||
        member.whatsappGroupStatus === "Remove") &&
      member.mobile
  );

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A"; // Handle empty dates or N/A case
    const date = new Date(dateString);
    return date.toLocaleDateString(); // You can customize the date format if needed
  };

  return (
    <div className="container mt-5">
      <h1>WhatsApp Group Management</h1>

      {/* Single Merged Table */}
      {/* <h2>WhatsApp Group</h2> */}
      <table className="table table-bordered">
        {" "}
        {/* Add Bootstrap class for styling */}
        <thead>
          <tr>
            <th>Member Name</th>
            <th>Member ID</th>
            <th>Membership Type</th>
            <th>Mobile Number</th>
            <th>Date of Payment</th>
            <th>Renewal Due On</th> {/* Separate column for renewal */}
            <th>WhatsApp Status</th> {/* New column */}
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => (
            <tr key={member.id}>
              <td>{member.memberName}</td>
              <td>{member.id}</td>
              <td>{member.currentMembershipType}</td>
              <td>{member.mobile}</td>
              <td>
                {formatDate(
                  member.payments
                    ? member.payments[member.payments.length - 1]?.dateOfPayment
                    : null
                )}{" "}
                {/* Show last payment date */}
              </td>
              <td>
                {member.currentMembershipType === "Annual"
                  ? formatDate(member.renewalDueOn)
                  : "N/A"}
              </td>{" "}
              {/* Renewal Due (Annual only) */}
              <td>
                {member.whatsappGroupStatus === "Add" ||
                member.whatsappGroupStatus === "Remove" ? (
                  <button onClick={() => handleStatusChange(member)}>
                    {member.whatsappGroupStatus}
                  </button>
                ) : (
                  member.whatsappGroupStatus // Display status text if not "Add" or "Remove"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WhatsappGroupManagement;
