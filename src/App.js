import "./global.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ApplicationsList from "./admin/ApplicationsList.js"; // Update the path if needed
import ApplicationDetails from "./admin/ApplicationDetails.js"; // Update the path if needed
import DataDisplay from "./DataDisplay.js";
import MembershipApplicationForm from "./MembershipApplicationForm.js";
import RenewalDueList from "./admin/RenewalDueList";
import HonoraryMemberInvite from "./admin/HonoraryMemberInvite.js";

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>KMA Membership Management System</h1>
        </header>
        <div className="button-container">
          <Link to="/new-application">
            <button>New Member Form</button>
          </Link>
          <Link to="/admin/applications">
            <button>Admin - Applications</button>
          </Link>
          <Link to="/admin/invite-honorary">
            <button>Admin - Invite Honorary Member</button>
          </Link>
          <Link to="/admin/renewals-due">
            <button>Admin - Renewals Due</button>
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
          <Route
            path="/admin/invite-honorary"
            element={<HonoraryMemberInvite />}
          />
          <Route path="/admin/renewals-due" element={<RenewalDueList />} />
          <Route path="/view-data" element={<DataDisplay />} />
          <Route
            path="/admin/application/:applicationKey"
            element={<ApplicationDetails />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
