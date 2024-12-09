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
import MemberInvite from "./admin/MemberInvite.js";
import ProtectedRoute from "./ProtectedRoute.js";
import { useContext } from "react";
import AuthContext from "./AuthContext.js";
import LoginPage from "./LoginPage.js";
import PaymentDetails from "./components/PaymentDetails.js";
import WelcomePage from "./WelcomePage.js";
import ThankYouPage from "./ThankYouPage.js";
import AdminDashboard from "./admin/AdminDashboard.js";

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
                <span>Welcome, {user.displayName}! </span>
                <button onClick={logout}>Logout</button>
              </div>
            ) : (
              <div>
                <button onClick={signInWithGoogle}>Sign in with Google</button>
              </div>
            )}
            <br />
          </div>
        </header>
        <div className="button-container">
          <Link to="/new-application">
            <button>New Member Form</button>
          </Link>
          <Link to="/admin/applications">
            <button>Admin - Applications</button>
          </Link>
          <Link to="/admin/invite-member">
            <button>Admin - Invite Member</button>
          </Link>
          <Link to="/admin/renewals-due">
            <button>Admin - Renewals Due</button>
          </Link>
          <Link to="/search">
            <button>Admin - Search Members</button>
          </Link>
          <Link to="/admin/dashboard">
            <button>Admin - Dashboard</button>
          </Link>
        </div>

        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route
            path="/payment-details/:memberID/:membershipType"
            element={<PaymentDetails />}
          />
          <Route
            path="/thank-you/:receiptNumber/:memberID"
            element={<ThankYouPage />}
          />
          <Route
            path="/new-application"
            element={
              <MembershipApplicationForm initialMembershipType="Annual" />
            }
          />
          <Route
            path="/new-application/life"
            element={<MembershipApplicationForm initialMembershipType="Life" />}
          />
          <Route
            path="/new-application/honorary"
            element={
              <MembershipApplicationForm initialMembershipType="Honorary" />
            }
          />

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
            path="/admin/invite-member"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <MemberInvite />
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
            path="/admin/application/:applicationId"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <ApplicationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <DataDisplay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRoles={authorizedAdminEmails}>
                <AdminDashboard />
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
