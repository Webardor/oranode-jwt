import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import UserProfile from "../pages/UserProfile";
import UserPassword from "../pages/UserPassword";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />

          <Route path="dashboard" element={<Dashboard />} />

          <Route path="user-profile" element={<UserProfile />} />

          <Route path="user-password" element={<UserPassword />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
