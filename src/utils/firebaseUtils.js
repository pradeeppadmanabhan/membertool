import { ref } from "firebase/database";

/**
 * Generate UID reference for Firebase.
 * @param {string} uid - The user's UID.
 * @param {object} db - The Firebase database instance.
 * @returns {object} Firebase reference for UID mapping.
 */
export const getUidRef = (uid, db) => {
  return ref(db, `uidToMemberID/${uid}`);
};

/**
 * Generate email key for Firebase (replace dots with commas).
 * @param {string} email - The user's email.
 * @returns {string} Firebase-compatible email key.
 */
export const getEmailKey = (email) => {
  return email.replace(/\./g, ",");
};

/**
 * Generate email reference for Firebase.
 * @param {string} email - The user's email.
 * @param {object} db - The Firebase database instance.
 * @returns {object} Firebase reference for email mapping.
 */
export const getEmailRef = (email, db) => {
  const emailKey = getEmailKey(email);
  return ref(db, `emailToMemberID/${emailKey}`);
};
