// src/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getDatabase, ref, get, set, update } from "firebase/database";
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
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);

  const generateMemberID = async (membershipType) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const idToken = await user.getIdToken();

      const response = await fetch(
        "https://us-central1-membertool-test.cloudfunctions.net/api/generateMemberID",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ currentMembershipType: membershipType }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate Member ID");

      const data = await response.json();

      console.log("Generated Member ID:", data.memberId);
      return data.memberId;
    } catch (error) {
      console.error("Error generating member ID:", error);
      return null;
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const adminRef = ref(db, "admins");
      const adminSnapshot = await get(adminRef);
      if (adminSnapshot.exists()) {
        const admins = adminSnapshot.val();
        //console.log("Admin users:", admins);
        const adminEmails = Object.values(admins).map((admin) => admin.email);
        //console.log("Admin emails:", adminEmails);
        return adminEmails;
      }
      return [];
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  };

  const signInWithGoogle = async () => {
    try {
      //console.log("Starting google sign in...");

      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      //console.log("Signed in user:", signedInUser);
      const adminEmails = await fetchAdminUsers();
      //console.log("SignInWithGoogle - Admin emails:", adminEmails);
      setIsAdmin(adminEmails.includes(signedInUser.email));

      if (signedInUser) {
        await checkOrExpandLegacyUser(signedInUser);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., display an error message)
    }
  };

  const checkOrExpandLegacyUser = async (signedInUser) => {
    const emailKey = signedInUser.email.replace(/\./g, ","); // Firebase keys cannot contain dots
    const uidRef = ref(db, `uidToMemberID/${signedInUser.uid}`);
    const emailRef = ref(db, `emailToMemberID/${emailKey}`);

    try {
      //Step 1: Check if user already has a UID mapping
      const uidSnapshot = await get(uidRef);
      if (uidSnapshot.exists()) {
        const memberID = uidSnapshot.val();
        //console.log("Existing UID mapping found: ", memberID);
        localStorage.setItem("memberID", memberID);
        setMemberID(memberID);
        await loadUserData(memberID);
        return;
      } else {
        console.error("No UID mapping found for user");
      }

      //Step 2: Check if email is already linked to a memberID
      const emailSnapshot = await get(emailRef);
      if (emailSnapshot.exists()) {
        const memberID = emailSnapshot.val();
        //console.log("Existing user found in email: ", memberID);

        //Store UID in users/{memberID}
        await update(ref(db, `users/${memberID}`), { uid: signedInUser.uid });

        //Store UID mapping for future logins
        await set(uidRef, memberID);
        localStorage.setItem("memberID", memberID);
        setMemberID(memberID);

        //Load user data
        await loadUserData(memberID);
        return;
      } else {
        console.error("No user found in email");
      }

      //Step 3: No existing data -> Register a new user
      const newMemberID = await generateMemberID("Annual");
      setMemberID(newMemberID);
      await set(ref(db, `users/${newMemberID}`), {
        uid: signedInUser.uid,
        email: signedInUser.email,
        memberName: signedInUser.displayName,
        membershipType: "Pending",
      });

      // Store mappings
      await set(uidRef, newMemberID);
      await set(emailRef, newMemberID);

      navigate("/welcome");
    } catch (error) {
      console.error("Error checking user", error);
    }
  };

  const loadUserData = async (memberID) => {
    const userRef = ref(db, `users/${memberID}`);
    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) {
      setUserData(userSnapshot.val(), memberID);
      setIsLoading(false);
      setHasCheckedUser(true);
      navigate("/profile");
    } else {
      navigate("/welcome");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setHasRedirected(false);
      localStorage.removeItem("redirectUrl");
      localStorage.removeItem("memberID");
      setMemberID(null);
      setUserData(null);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setUser(user);
        if (user && !hasCheckedUser) {
          //console.log("User in Auth Context: ", user);
          //console.log("User UID:", user.uid);
          //console.log("User Email:", user.email);
          //console.log("User Name:", user.displayName);
          const checkUser = async () => {
            await checkOrExpandLegacyUser(user);
          };

          checkUser();
        }

        setIsLoading(false);

        if (user) {
          const adminEmails = await fetchAdminUsers();

          //console.log("Admin Emails:", adminEmails);

          setIsAdmin(adminEmails.includes(user.email));
        }

        if (user && !hasRedirected) {
          const redirectUrl = localStorage.getItem("redirectUrl") || "/";
          //console.log("Redirecting to saved URL after login:", redirectUrl);

          localStorage.removeItem("redirectUrl");
          setHasRedirected(true);
          navigate(redirectUrl);
        }
      },
      [navigate, hasCheckedUser]
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, hasRedirected]);

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
