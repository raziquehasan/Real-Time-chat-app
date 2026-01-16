import React from "react";
import { Routes, Route, Navigate } from "react-router";
import PhoneLogin from "../pages/PhoneLogin";
import OTPVerify from "../pages/OTPVerify";
import ChatApp from "../pages/ChatApp";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes - OTP Authentication */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <PhoneLogin />}
      />
      <Route
        path="/verify-otp"
        element={isAuthenticated ? <Navigate to="/" replace /> : <OTPVerify />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<h1 className="text-center mt-10 text-2xl text-white">404 Page Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;