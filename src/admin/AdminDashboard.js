import React, { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import { normalizeUsers, categorizeUsers } from "../utils/MemberStatsUtils";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [users, setUsers] = useState([]);
  const [categorizedData, setCategorizedData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const database = getDatabase();
        const usersRef = ref(database, "users");
        const usersSnapshot = await get(usersRef);
        const fetchedUsers = usersSnapshot.val();

        if (fetchedUsers) {
          const usersArray = Object.values(fetchedUsers);
          const normalized = normalizeUsers(usersArray);
          setUsers(normalized);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const result = categorizeUsers(users, selectedYear);
      setCategorizedData(result);
      setStats(result.stats);
    }
  }, [users, selectedYear]);

  const years = [
    "All",
    ...Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) =>
      (2000 + i).toString(),
    ).reverse(),
  ];

  const handleStatCardClick = (category) => {
    setSelectedCategory(category);
  };

  const closeModal = () => {
    setSelectedCategory(null);
  };

  const exportToExcel = () => {
    if (!categorizedData || !selectedCategory) return;

    const filteredResults = categorizedData.lists[selectedCategory] || [];
    if (filteredResults.length === 0) return;

    const worksheetData = filteredResults.map((user) => ({
      Name: user.memberName || "",
      Email: user.email || "",
      "Membership Type": user.currentMembershipType || "",
      "Phone Number": user.mobile || "",
      Submission: user.dateOfSubmission
        ? new Date(user.dateOfSubmission).toLocaleDateString()
        : "",
      "Last Payment": user.lastPaymentDate
        ? user.lastPaymentDate.toLocaleDateString()
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    const fileName = `${selectedCategory}_${selectedYear}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const StatCard = ({ title, count, category }) => (
    <div
      className="col-md-2 stat-card-container"
      onClick={() => handleStatCardClick(category)}
      style={{ cursor: "pointer" }}
    >
      <div className="card stat-card">
        <h6 className="stat-card-title">{title}</h6>
        <p className="stat-card-count">{count}</p>
      </div>
    </div>
  );

  const getCategoryLabel = (category) => {
    const labels = {
      totalMembers: "All Time Total Members",
      annualNewMembers: "Annual - New Members",
      annualRenewals: "Annual - Renewals",
      annualUnpaid: "Annual - Unpaid",
      lifeNewMembers: "Life - New Members",
      lifeUpgraded: "Life - Upgraded",
      honoraryMembers: "Honorary Members",
    };
    return labels[category] || category;
  };

  return (
    <div className="container mt-5">
      <h1>Admin Dashboard</h1>

      <div className="year-selector">
        <label htmlFor="yearSelect">
          <strong>Select Year:</strong>
        </label>
        <select
          id="yearSelect"
          className="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Row 1: Total Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-overall">Overall</h5>
        </div>
        <StatCard
          title="All Time Total Members"
          count={stats.totalMembers || 0}
          category="totalMembers"
        />
      </div>

      {/* Row 2: Annual Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-annual">
            Annual Members (Year: {selectedYear})
          </h5>
        </div>
        <StatCard
          title="New Members"
          count={stats.annualNewMembers || 0}
          category="annualNewMembers"
        />
        <StatCard
          title="Renewals"
          count={stats.annualRenewals || 0}
          category="annualRenewals"
        />
        <StatCard
          title="Unpaid"
          count={stats.annualUnpaid || 0}
          category="annualUnpaid"
        />
        <StatCard
          title="Annual Total"
          count={stats.annualTotal || 0}
          category="annualTotal"
        />
      </div>

      {/* Row 3: Life Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-life">
            Life Members (Year: {selectedYear})
          </h5>
        </div>
        <StatCard
          title="New Members"
          count={stats.lifeNewMembers || 0}
          category="lifeNewMembers"
        />
        <StatCard
          title="Upgraded"
          count={stats.lifeUpgraded || 0}
          category="lifeUpgraded"
        />
        <StatCard
          title="Life Total"
          count={stats.lifeTotal || 0}
          category="lifeTotal"
        />
      </div>

      {/* Row 4: Honorary Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-honorary">
            Honorary Members (Year: {selectedYear})
          </h5>
        </div>
        <StatCard
          title="Honorary"
          count={stats.honoraryMembers || 0}
          category="honoraryMembers"
        />
      </div>

      {/* Row 5: Yearly Total Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-yearly">
            Yearly Summary (Year: {selectedYear})
          </h5>
        </div>
        <StatCard
          title="Total Members for Year"
          count={stats.yearlyTotalMembers || 0}
          category="yearlyTotalMembers"
        />
      </div>

      {/* Modal for Filtered Results */}
      {selectedCategory && (
        <div className="modal-backdrop">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h2>{getCategoryLabel(selectedCategory)}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body-custom">
              <p style={{ marginBottom: "15px", color: "#666" }}>
                Total Results:{" "}
                <strong>
                  {categorizedData?.lists[selectedCategory]?.length || 0}
                </strong>
              </p>

              {(categorizedData?.lists[selectedCategory]?.length || 0) > 0 ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Membership Type</th>
                      <th>Phone</th>
                      <th>Submission Date</th>
                      <th>Last Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorizedData.lists[selectedCategory].map(
                      (user, idx) => (
                        <tr key={user.id || idx}>
                          <td>{user.memberName || "N/A"}</td>
                          <td>{user.email || "N/A"}</td>
                          <td>{user.currentMembershipType || "N/A"}</td>
                          <td>{user.mobile || "N/A"}</td>
                          <td>
                            {user.dateOfSubmission
                              ? new Date(
                                  user.dateOfSubmission,
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>
                            {user.lastPaymentDate
                              ? user.lastPaymentDate.toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: "center", color: "#999" }}>
                  No results found
                </p>
              )}
            </div>

            <div className="modal-footer-custom">
              <button
                className="btn-export"
                onClick={exportToExcel}
                disabled={
                  (categorizedData?.lists[selectedCategory]?.length || 0) === 0
                }
              >
                📥 Download as Excel
              </button>
              <button className="btn-close-modal" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
