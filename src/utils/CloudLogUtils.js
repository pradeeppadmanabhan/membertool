import { auth } from "../AuthContext";

export const logToCloud = async (logData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const idToken = await user.getIdToken();

    const API_BASE = process.env.REACT_APP_API_BASE;
    console.log("API_BASE: ", API_BASE);

    const response = await fetch(`${API_BASE}/api/logToCloud`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ logData: logData }),
    });

    if (!response.ok) throw new Error("Failed to log to cloud");

    const data = await response.json();

    //console.log("logged to cloud successfully", data);
    return data;
  } catch (error) {
    console.error("Error logging to cloud:", error);
    return null;
  }
};
