import React, { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  normalizeUsers,
  computeDashboardStats,
} from "../utils/MemberStatsUtils";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [users, setUsers] = useState([]);

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
      const dashboardStats = computeDashboardStats(users, selectedYear);
      setStats(dashboardStats);
    }
  }, [users, selectedYear]);

  const years = [
    "All",
    ...Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) =>
      (2000 + i).toString(),
    ).reverse(),
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  const StatCard = ({ title, count }) => (
    <div className="col-md-2 stat-card-container">
      <div className="card stat-card">
        <h6 className="stat-card-title">{title}</h6>
        <p className="stat-card-count">
          {count}
        </p>
      </div>
    </div>
  );

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
          <h5 className="section-header-overall">
            Overall
          </h5>
        </div>
        <StatCard
          title="All Time Total Members"
          count={stats.totalMembers || 0}
        />
      </div>

      {/* Row 2: Annual Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-annual">
            Annual Members (Year: {selectedYear})
          </h5>
        </div>
        <StatCard title="New Members" count={stats.annualNewMembers || 0} />
        <StatCard title="Renewals" count={stats.annualRenewals || 0} />
        <StatCard title="Unpaid" count={stats.annualUnpaid || 0} />
        <StatCard title="Annual Total" count={stats.annualTotal || 0} />
      </div>

      {/* Row 3: Life Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-life">
            Life Members (Year: {selectedYear})
          </h5>
        </div>
        <StatCard title="New Members" count={stats.lifeNewMembers || 0} />
        <StatCard title="Upgraded" count={stats.lifeUpgraded || 0} />
        <StatCard title="Life Total" count={stats.lifeTotal || 0} />
      </div>

      {/* Row 4: Honorary Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-honorary">
            Honorary Members (Year: {selectedYear})
          </h5>
        </div>
        <StatCard title="Honorary" count={stats.honoraryMembers || 0} />
      </div>

      {/* Row 5: Yearly Total Members */}
      <div className="row dashboard-row">
        <div className="col-md-12">
          <h5 className="section-header-yearly">
            Yearly Summary (Year: {selectedYear})
          </h5>
        </div>
        <StatCard title="Total Members for Year" count={stats.yearlyTotalMembers || 0} />
      </div>
    </div>
  );
};

export default AdminDashboard;
