// src/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  get,
  update,
  runTransaction,
} from "firebase/database";
import { app } from "./firebase";
import { useNavigate } from "react-router-dom";
import { getUidRef, getEmailRef } from "./utils/firebaseUtils";

const auth = getAuth(app);
export { auth };
const googleProvider = new GoogleAuthProvider();
const db = getDatabase(app);

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [memberID, setMemberID] = useState(
    localStorage.getItem("memberID") || null
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const hasCheckedUser = useRef(false);
  const isNewUserRef = useRef(false);

  const generateMemberID = useCallback(async (membershipType) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken();

      const API_BASE = process.env.REACT_APP_API_BASE;
      console.log("API_BASE: ", API_BASE);

      const response = await fetch(`${API_BASE}/api/generateMemberID`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ currentMembershipType: membershipType }),
      });

      if (!response.ok) throw new Error("Failed to generate Member ID");

      const data = await response.json();

      console.log("Generated Member ID:", data.memberId);
      return data.memberId;
    } catch (error) {
      console.error("Error generating member ID:", error);
      return null;
    }
  }, []);

  // Function to sign in with Google
  // This function clears any cached data before signing in
  const signInWithGoogle = async () => {
    try {
      //Clear cached data
      localStorage.removeItem("memberID");
      localStorage.removeItem("redirectUrl");
      setMemberID(null);
      setUserData(null);

      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      //console.log("Signed in user:", signedInUser);
      setUser(signedInUser);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., display an error message)
      alert("Error signing in with Google. Please try again.");
    }
  };

  const loadUserData = useCallback(async (memberID) => {
    try {
      const userRef = ref(db, `users/${memberID}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        setUserData(userSnapshot.val(), memberID);
        setIsLoading(false);
        hasCheckedUser.current = true;
      } else {
        console.error("EUNM: No user data found for memberID:", memberID);
        setUserData(null);
        setIsLoading(false);
        hasCheckedUser.current = true;
        throw new Error("No user data found for memberID: " + memberID);
      }
      /* //1. Simulate userData Not Found
      console.log("Simulating userData not found for memberID:", memberID);
      // Simulate no user data found
      throw new Error("No user data found for memberID: " + memberID); */
    } catch (error) {
      console.error("Error loading user data:", error);
      setAuthError(error.message);
      setUserData(null);
      setIsLoading(false);
      hasCheckedUser.current = true;
      throw new Error("Error loading user data: " + error.message);
    }
  }, []);

  const checkOrExpandLegacyUser = useCallback(
    //Normal Functionality
    async (signedInUser) => {
      if (!signedInUser) return null;

      /* const emailKey = signedInUser.email.replace(/\./g, ","); // Firebase keys cannot contain dots
      const uidRef = ref(db, `uidToMemberID/${signedInUser.uid}`);
      const emailRef = ref(db, `emailToMemberID/${emailKey}`); */
      const uidRef = getUidRef(signedInUser.uid, db);
      const emailRef = getEmailRef(signedInUser.email, db);

      try {
        //Step 1: Check if user already has a UID mapping
        const uidSnapshot = await get(uidRef);
        if (uidSnapshot.exists()) {
          const memberID = uidSnapshot.val();
          console.log("Existing UID mapping found: ", memberID);

          // Ensure the `uid` field is set in the `users` node
          const userRef = ref(db, `users/${memberID}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists() && !userSnapshot.val().uid) {
            await update(userRef, { uid: signedInUser.uid });
          }

          localStorage.setItem("memberID", memberID);
          setMemberID(memberID);
          isNewUserRef.current = false;
          await loadUserData(memberID);
          return memberID;
        } else {
          console.log(
            "No UID mapping found for user with UID:",
            signedInUser.uid
          );
        }

        //Step 2: Check if email is already linked to a memberID
        const emailSnapshot = await get(emailRef);
        if (emailSnapshot.exists()) {
          const existingMemberID = emailSnapshot.val();
          console.log("Existing user found by email: ", existingMemberID);

          //Store UID in users/{memberID}
          await update(ref(db, `users/${existingMemberID}`), {
            uid: signedInUser.uid,
          });

          //Store UID mapping for future logins
          await runTransaction(uidRef, (currentData) =>
            currentData === null ? existingMemberID : undefined
          );
          localStorage.setItem("memberID", existingMemberID);
          setMemberID(existingMemberID);
          isNewUserRef.current = false;

          //Load user data
          await loadUserData(existingMemberID);
          return existingMemberID;
        } else {
          console.log("No user found by email :", signedInUser.email);
        }

        //Step 3: No existing data -> Register a new user
        isNewUserRef.current = true;
        console.log("isNewUserRef.current:", isNewUserRef.current);
        console.log("Creating new user profile for:", signedInUser.email);

        return null; // Return null to indicate new user creation
      } catch (error) {
        console.error("Error checking user", error);
        setAuthError(error.message);
        setUserData(null);
        setIsLoading(false);
        hasCheckedUser.current = true;
        throw new Error("Error checking user: " + error.message);
      }
    },

    [loadUserData]
  );

  const logout = async () => {
    try {
      console.log("Logging out user:", user?.email);
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      hasCheckedUser.current = false;
      hasRedirected.current = false;
      setIsLoading(false);
      localStorage.removeItem("redirectUrl");
      localStorage.removeItem("memberID");
      setMemberID(null);
      setUserData(null);
      isNewUserRef.current = true;
      setAuthError(null);
      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        //console.log("OnAuthStateChanged.. ", user);
        /*  
        //Clearing for Retry mechanism
        localStorage.removeItem("redirectUrl");
        localStorage.removeItem("memberID");
        setMemberID(null);
        setUserData(null); */

        if (!user) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        setUser(user);

        if (hasCheckedUser.current) return;
        hasCheckedUser.current = true;

        console.log("User in Auth Context: ", user);
        //console.log("User UID:", user.uid);
        //console.log("User Email:", user.email);
        //console.log("User Name:", user.displayName);

        const memberID = await checkOrExpandLegacyUser(user);
        console.log("Member ID from checkOrExpandLegacyUser:", memberID);

        if (memberID === null) {
          console.log("New user detected, proceeding without MemberID...");
          setIsLoading(false);
          return;
        }

        setMemberID(memberID);
        localStorage.setItem("memberID", memberID);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in Authenticaion Process:", error);
        setAuthError(error.message);
        setUserData(null);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [checkOrExpandLegacyUser]);

  useEffect(() => {
    if (!user || hasRedirected.current) return;

    hasRedirected.current = true;

    const adminEmails = ["coffeecup.developers@gmail.com", "info@kmaindia.org"]; // await fetchAdminUsers();
    const isAdmin = adminEmails.includes(user?.email);
    setIsAdmin(isAdmin);

    setTimeout(() => {
      let redirectUrl;

      /* console.log("isNewUserRef:", isNewUserRef.current);
      console.log("memberID:", memberID);
      console.log("user:", user);
      console.log("isAdmin:", isAdmin);
      console.log("userData:", userData); */

      if (!user) {
        console.log("User is logged out. Skipping redirection.");
        setIsLoading(false);
        return; // Skip redirection if the user is logged out
      }

      if (isNewUserRef.current) {
        console.log("Redirecting new user to application form");
        redirectUrl = "/new-application"; // Redirect new users to the application form
      } /* else if (userData?.applicationStatus === "Submitted") {
        redirectUrl = `/payment-details?memberID=${memberID}&membershipType=${userData.currentMembershipType}`;
      } else if (userData?.applicationStatus === "Paid") {
        redirectUrl = `/profile/${memberID}`;
      } else if (userData?.applicationStatus === "Pending") {
        redirectUrl = "/new-application"; // Redirect to incomplete application
      } */ else {
        redirectUrl = isAdmin ? "/admin/dashboard" : "/profile";
      }
      console.log("Redirection to ", redirectUrl);
      localStorage.removeItem("redirectUrl");
      navigate(redirectUrl);
    }, 500);
  }, [navigate, isNewUserRef, memberID, user, isAdmin, userData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        userData,
        memberID,
        authError,
        isNewUser: isNewUserRef.current,
        signInWithGoogle,
        logout,
        generateMemberID,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
