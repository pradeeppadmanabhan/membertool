import "./global.css";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ApplicationsList from "./admin/ApplicationsList.js"; // Update the path if needed
import ApplicationDetails from "./admin/ApplicationDetails.js"; // Update the path if needed
import DataDisplay from "./DataDisplay.js";
import MembershipApplicationForm from "./MembershipApplicationForm.js";
import RenewalDueList from "./admin/RenewalDueList";
import MemberInvite from "./admin/MemberInvite.js";
import ProtectedRoute from "./ProtectedRoute.js";
import { useContext, useEffect } from "react";
import AuthContext from "./AuthContext.js";
import LoginPage from "./LoginPage.js";
import PaymentDetails from "./components/PaymentDetails.js";
import WelcomePage from "./WelcomePage.js";
import ThankYouPage from "./ThankYouPage.js";
import AdminDashboard from "./admin/AdminDashboard.js";
import WhatsappGroupManagement from "./admin/WhatsappGroupManagement.js";

function App() {
  const { user, signInWithGoogle, logout, isLoading } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
  const authorizedAdminEmails = ["coffeecup.developers@gmail.com"];

  return (
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
        {authorizedAdminEmails.includes(user?.email) && (
          <>
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
            <Link to="/admin/whatsapp-group-management">
              <button>Admin - Manage WhatsApp Groups</button>
            </Link>
            <Link to="/search">
              <button>Admin - Search Members</button>
            </Link>
            <Link to="/admin/dashboard">
              <button>Admin - Dashboard</button>
            </Link>
          </>
        )}
      </div>

      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/payment-details" element={<PaymentDetails />} />
        <Route
          path="/thank-you/:receiptNumber/:memberID"
          element={<ThankYouPage />}
        />
        <Route
          path="/new-application"
          element={<MembershipApplicationForm initialMembershipType="Annual" />}
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
        {/* Redirect to home if route not found */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
