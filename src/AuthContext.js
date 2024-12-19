// src/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "./firebase";
import { useNavigate } from "react-router-dom";

const auth = getAuth(app);
export { auth };
const googleProvider = new GoogleAuthProvider();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  const signInWithGoogle = async () => {
    try {
      console.log("Starting google sign in...");

      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., display an error message)
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setHasRedirected(false);
      localStorage.removeItem("redirectUrl");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        //console.log("User in Auth Context: ", user);
        //console.log("User UID:", user.uid);
        //console.log("User Email:", user.email);
        console.log("User Name:", user.displayName);
      }

      setUser(user);
      setIsLoading(false);

      if (user && !hasRedirected) {
        const redirectUrl = localStorage.getItem("redirectUrl") || "/";
        console.log("Redirecting to saved URL after login:", redirectUrl);

        localStorage.removeItem("redirectUrl");
        setHasRedirected(true);
        navigate(redirectUrl);
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, hasRedirected]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
