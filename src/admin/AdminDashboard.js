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
  const [selectedYear, setSelectedYear] = useState("All");
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
          const processedUsers = Object.values(fetchedUsers).map((user) => {
            const payments = user.payments || [];
            return payments.map((payment) => ({
              ...payment,
              //membershipType: payment.membershipType, // Inherit membership type from user
              memberId: user.id, // Inherit member ID from user
              memberName: user.memberName, // Inherit member name from user
            }));
          });

          //console.log("Processed Users:", processedUsers);

          // Flatten nested payments into a single array
          const allPayments = processedUsers.flat();
          setUsers(allPayments);
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
      const filteredPayments = users.filter((payment) => {
        if (payment.dateOfPayment) {
          const date = new Date(payment.dateOfPayment);
          return year === "All" || date.getFullYear() === parseInt(year, 10);
        }
        return false;
      });

      processStatsAndCharts(filteredPayments);
    },
    [users]
  );

  useEffect(() => {
    if (users.length > 0) {
      filterDataByYear(selectedYear);
    }
  }, [selectedYear, users, filterDataByYear]);

  const processStatsAndCharts = (filteredPayments) => {
    // Process stats
    const totalPayments = filteredPayments.length;
    const membershipCounts = { Life: 0, Annual: 0, Honorary: 0 };
    const membershipAmounts = { Life: 0, Annual: 0, Honorary: 0 };

    filteredPayments.forEach((payment) => {
      const type = payment.membershipType;
      if (type) {
        membershipCounts[type]++;
        membershipAmounts[type] += payment.amount || 0;
      }
    });

    /*     const lifeMembers = filteredUsers.filter(
      (user) => user.membershipType === "Life"
    ).length;
    const annualMembers = filteredUsers.filter(
      (user) => user.membershipType === "Annual"
    ).length;
    const honoraryMembers = filteredUsers.filter(
      (user) => user.membershipType === "Honorary"
    ).length;

    const lifeAmount = filteredUsers.reduce((sum, user) => {
      return user.membershipType === "Life" ? sum + (user.amount || 0) : sum;
    }, 0);

    const annualAmount = filteredUsers.reduce((sum, user) => {
      return user.membershipType === "Annual" ? sum + (user.amount || 0) : sum;
    }, 0);

    const honoraryAmount = filteredUsers.reduce((sum, user) => {
      return user.membershipType === "Honorary"
        ? sum + (user.amount || 0)
        : sum;
    }, 0);
 */
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

    // Process Monthly Data for Charts
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

    filteredPayments.forEach((payment) => {
      if (payment.dateOfPayment) {
        const date = new Date(payment.dateOfPayment);
        const month = date.getMonth(); // 0 = Jan, 1 = Feb, ...

        if (!isNaN(month) && month >= 0 && month < 12) {
          const type = payment.membershipType;
          if (type && monthlyData[month][type] !== undefined) {
            monthlyData[month][type]++;
            monthlyAmounts[month][type] += payment.amount || 0;
            /* console.log(
              `User: ${payment.memberName} (ID: ${payment.memberId})`,
              `Payment Type: ${payment.membershipType}`,
              `Amount: ₹${payment.amount}`,
              `Month: ${new Date(payment.dateOfPayment).toLocaleString(
                "default",
                {
                  month: "long",
                }
              )}`
            );*/
          } else {
            console.warn("Invalid membership type for payment:", type, payment);
          }
        }

        if (isNaN(month) || month < 0 || month > 11) {
          console.warn("Invalid date or month for payment:", month, payment);
        }
      }
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
