// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom"; // Import Outlet

export default function ProtectedRoute({ allowedRoles }) { // รับ prop allowedRoles
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
      return <Navigate to="/login" replace />; // Redirect to login if user data is corrupt
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

 
  const userRoleAsString = String(user.role); // แปลง role ให้เป็น String เพื่อให้เปรียบเทียบได้ง่ายขึ้น
  if (allowedRoles && !allowedRoles.includes(userRoleAsString)) {
    
    console.warn(`User with role ${userRoleAsString} tried to access protected route. Redirecting.`);
    return <Navigate to="/" replace />; // หรือไปหน้า /unauthorized
  }

  
  return <Outlet />; 
}
