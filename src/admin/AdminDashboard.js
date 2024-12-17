import React, { useEffect, useState, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { getDatabase, ref, get } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [memberChart, setMemberChart] = useState({ labels: [], datasets: [] });
  const [amountChart, setAmountChart] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
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
          setUsers(usersArray);
          console.log("Users:", usersArray);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterDataByYear = useCallback(
    (year) => {
      const filteredUsers = users.filter((user) => {
        const payments = user.payments || [];
        if (payments.length > 0) {
          const date = new Date(payments[payments.length - 1].dateOfPayment);
          return year === "All" || date.getFullYear() === parseInt(year, 10);
        } else {
          return false;
        }
      });
      processStatsAndCharts(filteredUsers);
    },
    [users]
  );

  useEffect(() => {
    if (users.length > 0) {
      filterDataByYear(selectedYear);
    }
  }, [selectedYear, users, filterDataByYear]);

  const processStatsAndCharts = (filteredUsers) => {
    // Process stats
    const totalPayments = filteredUsers.length;
    const membershipCounts = { Life: 0, Annual: 0, Honorary: 0 };
    const membershipAmounts = { Life: 0, Annual: 0, Honorary: 0 };

    // Initialize monthlyData and monthlyAmounts *inside* the function
    const monthlyData = Array.from({ length: 12 }, () => ({
      Life: 0,
      Annual: 0,
      Honorary: 0,
    }));
    const monthlyAmounts = Array.from({ length: 12 }, () => ({
      Life: 0,
      Annual: 0,
      Honorary: 0,
    }));

    filteredUsers.forEach((user) => {
      membershipCounts[user.currentMembershipType]++;

      const payments = user.payments || [];
      if (payments.length > 0) {
        const lastPayment = payments[payments.length - 1];
        const type = lastPayment.membershipType;
        membershipAmounts[type] += lastPayment.amount || 0;

        const date = new Date(lastPayment.dateOfPayment);
        const month = date.getMonth();
        if (!isNaN(month) && month >= 0 && month < 12) {
          monthlyData[month][type]++;
          monthlyAmounts[month][type] += lastPayment.amount || 0;
        }
      }
    });

    setStats({
      totalMembers: totalPayments,
      lifeMembers: membershipCounts.Life,
      annualMembers: membershipCounts.Annual,
      honoraryMembers: membershipCounts.Honorary,
      totalAmount:
        membershipAmounts.Life +
        membershipAmounts.Annual +
        membershipAmounts.Honorary,
      lifeAmount: membershipAmounts.Life,
      annualAmount: membershipAmounts.Annual,
      honoraryAmount: membershipAmounts.Honorary,
    });

    const memberChartData = {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Life Members",
          data: monthlyData.map((month) => month.Life),
          backgroundColor: "blue",
        },
        {
          label: "Annual Members",
          data: monthlyData.map((month) => month.Annual),
          backgroundColor: "green",
        },
        {
          label: "Honorary Members",
          data: monthlyData.map((month) => month.Honorary),
          backgroundColor: "orange",
        },
      ],
    };

    const amountChartData = {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Life Membership Amount",
          data: monthlyAmounts.map((month) => month.Life),
          backgroundColor: "blue",
        },
        {
          label: "Annual Membership Amount",
          data: monthlyAmounts.map((month) => month.Annual),
          backgroundColor: "green",
        },
      ],
    };

    setMemberChart(memberChartData);
    setAmountChart(amountChartData);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const years = [
    "All",
    ...Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) =>
      (2000 + i).toString()
    ).reverse(),
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Admin Dashboard</h1>

      <div className="row justify-content-center mb-4">
        <div className="col-md-4 text-center ">
          <label htmlFor="yearSelect" className="form-label">
            Select Year:
          </label>
          <select
            id="yearSelect"
            className="form-control"
            value={selectedYear}
            onChange={handleYearChange}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        {/* Stats Cards */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5>Total Members</h5>
              <p>{stats.totalMembers || 0}</p>
              <p>₹{stats.totalAmount || 0}</p>
            </div>
          </div>
        </div>
        {/* Add other stats cards here */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5>Total Life Members</h5>
              <p>{stats.lifeMembers || 0}</p>
              <p>₹{stats.lifeAmount || 0}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5>Total Annual Members</h5>
              <p>{stats.annualMembers || 0}</p>
              <p>₹{stats.annualAmount || 0}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5>Total Honorary Members</h5>
              <p>{stats.honoraryMembers || 0}</p>
              <p>₹{stats.honoraryAmount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <strong>Monthly Membership Enrollment</strong>
          <Bar data={memberChart} />
        </div>
        <div className="col-md-6">
          <strong>Monthly Membership Amount</strong>
          <Bar data={amountChart} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
