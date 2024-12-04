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

const auth = getAuth(app);
export { auth };
const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., display an error message)
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      //console.log("User UID:", user.uid);
      //console.log("User Name:", user.displayName);
      //console.log("User Email:", user.email);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
