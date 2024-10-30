import React, { useState } from "react";
import "./global.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ApplicationsList from "./admin/ApplicationsList.js"; // Update the path if needed
import ApplicationDetails from "./admin/ApplicationDetails.js"; // Update the path if needed
import DataDisplay from "./DataDisplay.js";
import MembershipApplicationForm from "./MembershipApplicationForm.js";

function App() {
  const [showForm, setShowForm] = useState(false); // State to manage which component to show
  const [showData, setShowData] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
    setShowData(false);
  };

  const handleShowData = () => {
    setShowData(true);
    setShowForm(false);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Membership Tool</h1>
        </header>
        <div className="button-container">
          <Link to="/new-application">
            <button>New Member Form</button>
          </Link>
          <Link to="/admin/applications">
            <button>Admin - Applications</button>
          </Link>
          <Link to="/view-data">
            <button>View Member Data</button>
          </Link>
        </div>

        {/* Remove the separate <nav> section */}

        <Routes>
          <Route
            path="/new-application"
            element={<MembershipApplicationForm />}
          />
          <Route path="/admin/applications" element={<ApplicationsList />} />
          <Route path="/view-data" element={<DataDisplay />} />
          {/* Add route for DataDisplay */}
          <Route
            path="/admin/application/:applicationKey"
            element={<ApplicationDetails />}
          />
          {/* Add route for ApplicationDetails */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
