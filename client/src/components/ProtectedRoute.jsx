import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  
  let user = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error("Failed to parse user from localStorage in ProtectedRoute", e);
      localStorage.removeItem("user"); // Clear invalid user data
      localStorage.removeItem("token"); // Clear token as well
      return <Navigate to="/login" replace />;
    }
  }

 
  if (!token) {
    return <Navigate to="/login" replace />;
  }

 
  if (!user || !user.role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

 
  const userRoleAsString = String(user.role);
  if (allowedRoles && !allowedRoles.includes(userRoleAsString)) {
    
    console.warn(`User with role ${userRoleAsString} tried to access protected route. Redirecting.`);
    return <Navigate to="/" replace />;
  }

  
  return <Outlet />; 
}
