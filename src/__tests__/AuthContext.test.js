import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";
import { get, set, update, runTransaction } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

jest.mock("firebase/auth");
jest.mock("firebase/database");
jest.mock("react-router-dom");

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should load user data and set memberID on login", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    // Wait for user data to load
    await screen.findByText("Test Child Component");

    // Check if memberID is set
    expect(localStorage.getItem("memberID")).toBe("mockMemberID");
  });

  test("should handle missing user data gracefully", async () => {
    get.mockImplementationOnce(() => Promise.resolve({ exists: () => false }));

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    // Wait for error handling
    await screen.findByText(/Error loading user data/i);
  });

  test("should redirect admin users to the dashboard", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    // Wait for redirection
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard")
    );
  });

  test("should redirect non-admin users to their profile", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    // Wait for redirection
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/profile"));
  });

  test("should create a new user profile if no existing data is found", async () => {
    get.mockImplementation((ref) => {
      if (ref.path === "uidToMemberID/mockUID") {
        return Promise.resolve({ exists: () => false });
      }
      if (ref.path === "emailToMemberID/mockuser@gmail,com") {
        return Promise.resolve({ exists: () => false });
      }
      return Promise.resolve({ exists: () => false });
    });

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    // Wait for new user creation
    await waitFor(() =>
      expect(set).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    );

    // Check if memberID is set
    expect(localStorage.getItem("memberID")).toBeTruthy();
  });
});
