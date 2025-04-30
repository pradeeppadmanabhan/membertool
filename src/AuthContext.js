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
  set,
  update,
  runTransaction,
} from "firebase/database";
import { app } from "./firebase";
import { useNavigate } from "react-router-dom";

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
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const hasCheckedUser = useRef(false);

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

  const fetchAdminUsers = useCallback(async () => {
    try {
      const adminRef = ref(db, "admins");
      const adminSnapshot = await get(adminRef);
      if (adminSnapshot.exists()) {
        return Object.values(adminSnapshot.val()).map((admin) => admin.email);
      }
      return [];
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
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
    }
  }, []);

  const checkOrExpandLegacyUser = useCallback(
    async (signedInUser) => {
      if (!signedInUser) return null;

      const emailKey = signedInUser.email.replace(/\./g, ","); // Firebase keys cannot contain dots
      const uidRef = ref(db, `uidToMemberID/${signedInUser.uid}`);
      const emailRef = ref(db, `emailToMemberID/${emailKey}`);

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
          await loadUserData(memberID);
          return memberID;
        } else {
          console.error("No UID mapping found for user");
        }

        //Step 2: Check if email is already linked to a memberID
        const emailSnapshot = await get(emailRef);
        if (emailSnapshot.exists()) {
          const existingMemberID = emailSnapshot.val();
          console.log("Existing user found by email: ", memberID);

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

          //Load user data
          await loadUserData(existingMemberID);
          return existingMemberID;
        } else {
          console.error("No user found by email");
        }

        //Step 3: No existing data -> Register a new user
        const newMemberID = await generateMemberID("Annual");
        if (!newMemberID) return null;
        setIsNewUser(true);
        setMemberID(newMemberID);
        console.log("Creating new user with memderID:", newMemberID);
        localStorage.setItem("memberID", newMemberID);
        await set(ref(db, `users/${newMemberID}`), {
          id: newMemberID,
          uid: signedInUser.uid,
          email: signedInUser.email,
          memberName: signedInUser.displayName,
          membershipType: "Annual",
          currentMembershipType: "Annual",
          applicationStatus: "Pending",
          dateOfSubmission: new Date().toISOString(),
          payments: [],
        });

        //Load user data
        await loadUserData(newMemberID);

        // Store mappings
        await runTransaction(uidRef, (currentData) =>
          currentData === null ? newMemberID : undefined
        );
        await runTransaction(emailRef, (currentData) =>
          currentData === null ? newMemberID : undefined
        );

        return newMemberID;
      } catch (error) {
        console.error("Error checking user", error);
      }
    },
    [loadUserData, memberID, generateMemberID]
  );

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      hasCheckedUser.current = false;
      hasRedirected.current = false;
      setIsLoading(true);
      localStorage.removeItem("redirectUrl");
      localStorage.removeItem("memberID");
      setMemberID(null);
      setUserData(null);
      setIsNewUser(false);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      //console.log("OnAuthStateChanged.. ", user);
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

      if (!memberID) {
        console.error("Member ID could not be determined, skipping redirect!");
        setIsLoading(false);
        return;
      }

      setMemberID(memberID);
      localStorage.setItem("memberID", memberID);
    });

    return unsubscribe;
  }, [checkOrExpandLegacyUser, fetchAdminUsers]);

  useEffect(() => {
    if (!memberID || hasRedirected.current) return;

    hasRedirected.current = true;

    const adminEmails = ["coffeecup.developers@gmail.com", "info@kmaindia.org"]; // await fetchAdminUsers();
    const isAdmin = adminEmails.includes(user?.email);
    setIsAdmin(isAdmin);

    setTimeout(() => {
      let redirectUrl;

      if (isNewUser) {
        redirectUrl = "/new-application";
      } else {
        redirectUrl =
          localStorage.getItem("redirectUrl") ||
          (isAdmin ? "/admin/dashboard" : "/profile");
      }
      console.log("Redirection to ", redirectUrl);
      localStorage.removeItem("redirectUrl");
      navigate(redirectUrl);
    }, 500);
  }, [navigate, isNewUser, memberID, user?.email]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        userData,
        memberID,
        signInWithGoogle,
        logout,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
