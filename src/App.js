import "./global.css";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useContext, useEffect } from "react";
import AuthContext from "./AuthContext.js";
import ApplicationsList from "./admin/ApplicationsList.js"; // Update the path if needed
import ApplicationDetails from "./admin/ApplicationDetails.js"; // Update the path if needed
import DataDisplay from "./DataDisplay.js";
import MembershipApplicationForm from "./MembershipApplicationForm.js";
import RenewalDueList from "./admin/RenewalDueList";
import MemberInvite from "./admin/MemberInvite.js";
import ProtectedRoute from "./ProtectedRoute.js";
import LoginPage from "./LoginPage.js";
import PaymentDetails from "./components/PaymentDetails.js";
import WelcomePage from "./WelcomePage.js";
import ThankYouPage from "./ThankYouPage.js";
import AdminDashboard from "./admin/AdminDashboard.js";
import WhatsappGroupManagement from "./admin/WhatsappGroupManagement.js";
import ProfilePage from "./ProfilePage.js";
import MaintenancePage from "./MaintenancePage.js";

function App() {
  const { user, isAdmin, logout, isLoading, authError, isNewUser, userData } =
    useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const initialMembershipType = searchParams.get("initialMembershipType");

    if (initialMembershipType) {
      console.log("Initial Membership Type from URL:", initialMembershipType);
      localStorage.setItem("initialMembershipType", initialMembershipType);
    }

    /* console.log("Current Route:", location.pathname);
    console.log("Current User:", user);
    console.log("search:", location.search);
    console.log("isLoading", isLoading); */

    const protectedRoutes = [
      "/new-application",
      "/new-application/life",
      "/new-application/honorary",
      "/payment-details",
    ]; // Add protected routes here

    if (!isLoading) {
      if (!user && protectedRoutes.includes(location.pathname)) {
        const currentPath = location.pathname + location.search;
        //console.log("Storing redirect URL:", currentPath);
        localStorage.setItem("redirectUrl", currentPath);

        // Redirect to /login
        if (location.pathname !== "/login") {
          //console.log("Redirecting to /login");
          navigate("/login");
        }
      }
    }
    //console.log("Redirect URL Stored: ", localStorage.getItem("redirectUrl"));
  }, [user, isLoading, navigate, location.pathname, location.search]);

  //Define authorized admin emails
  const authorizedAdminEmails = isAdmin ? [user?.email] : [];

  // Fallback for loading state
  if (isLoading) {
    return <div>Loading...</div>; // Show a loading spinner or message
  }

  /* console.log("User Data:", userData);
  console.log("User:", user);
  console.log("Is New User:", isNewUser);
  console.log("Auth Error:", authError); */

  // Fallback for missing userData
  if (user) {
    if (authError) {
      if (!isNewUser && !userData) {
        console.error(
          "User is not new and userData is missing, displaying error."
        );
        return (
          <div className="center-text" style={{ marginTop: "20px" }}>
            <p className="status-message error">
              Error: {authError}. Please contact support or try logging out,
              clear your browser cache, and logging back in.
            </p>
            <button onClick={logout} className="cancel-button">
              Logout
            </button>
          </div>
        );
      }
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <br />
        <h1>KMA Membership Management System</h1>
        {/* Ribbon Banner */}
        <div className="ribbon-banner">
          <p>
            🚧 This application is in Beta mode. Please report issues to{" "}
            <a href="mailto:info@kmaindia.org">info@kmaindia.org</a> / whatsapp
            to +91-988-058-8172. 🚧
          </p>
        </div>
        {/* Authentication Controls */}
        <div className="welcome-container">
          {user ? (
            <div>
              <br />
              <span>Welcome, {user.displayName}! </span>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <div></div>
          )}
          <br />
          <br />
          <br />
        </div>
      </header>

      <div className="button-container">
        {authorizedAdminEmails.includes(user?.email) && (
          <>
            {!isAdmin && (
              <Link to="/new-application">
                <button>New Member Form</button>
              </Link>
            )}
            <Link to="/admin/applications">
              <button>Member Directory</button>
            </Link>
            <Link to="/admin/invite-member">
              <button>Invite Member</button>
            </Link>
            <Link to="/admin/renewals-due">
              <button>Renewals & Upgrades</button>
            </Link>
            {/* <Link to="/admin/whatsapp-group-management">
              <button>Manage WhatsApp</button>
            </Link>
            Note: Functionality moved out of Admin Dashboard. Feature not used by KMA.
             */}
            {/* <Link to="/search">
              <button>Search Members</button>
            </Link>
            Note: Integrated member search with directory search */}
            <Link to="/admin/dashboard">
              <button>Dashboard</button>
            </Link>
          </>
        )}
      </div>

      <Routes>
        <Route path="/maintainance" element={<MaintenancePage />} />{" "}
        {/* -- Maintenance Banner */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/payment-details" element={<PaymentDetails />} />
        <Route
          path="/thank-you/:receiptNumber/:memberID"
          element={<ThankYouPage />}
        />
        <Route
          path="/new-application"
          element={<MembershipApplicationForm />}
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
          path="/admin/whatsapp-group-management"
          element={
            <ProtectedRoute requiredRoles={authorizedAdminEmails}>
              <WhatsappGroupManagement />
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
        {/* Redirect to Profile if route not found */}
        <Route path="*" element={<Navigate to="/profile" />} />
      </Routes>
    </div>
  );
}

export default App;
