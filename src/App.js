import "./global.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import ApplicationsList from "./admin/ApplicationsList.js"; // Update the path if needed
import ApplicationDetails from "./admin/ApplicationDetails.js"; // Update the path if needed
import DataDisplay from "./DataDisplay.js";
import MembershipApplicationForm from "./MembershipApplicationForm.js";
import RenewalDueList from "./admin/RenewalDueList";
import HonoraryMemberInvite from "./admin/HonoraryMemberInvite.js";
import ProtectedRoute from "./ProtectedRoute.js";
import { useContext } from "react";
import AuthContext from "./AuthContext.js";
import LoginPage from "./LoginPage.js";

function App() {
  const { user, signInWithGoogle, logout } = useContext(AuthContext);

  //Define authorized admin emails
  const authorizedAdminEmails = ["coffeecup.developers@gmail.com"];

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>KMA Membership Management System</h1>
          {/* Authentication Controls */}
          <div>
            {user ? (
              <div>
                <span>Welcome, {user.displayName}!</span>
                <button onClick={logout}>Logout</button>
              </div>
            ) : (
              <div>
                <button onClick={signInWithGoogle}>Sign in with Google</button>
              </div>
            )}
          </div>
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
          <Link to="/search">
            <button>View Member Data</button>
          </Link>
        </div>

        <Routes>
          <Route path="/" element={<MembershipApplicationForm />} />
          <Route
            path="/new-application"
            element={<MembershipApplicationForm />}
          />
          <Route path="/search" element={<DataDisplay />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <ApplicationsList />
              </ProtectedRoute>
            }
          />

          {/* <Route path="/admin/applications" element={<ApplicationsList />} /> */}
          <Route
            path="/admin/invite-honorary"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <HonoraryMemberInvite />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/renewals-due"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <RenewalDueList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/application/:applicationKey"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <ApplicationDetails />
              </ProtectedRoute>
            }
          />
          {/* Redirect to home if route not found */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
