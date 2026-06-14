import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import UserProfile from "../pages/UserProfile";
import UserPassword from "../pages/UserPassword";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route path="user-profile" element={<UserProfile />} />

        <Route path="user-password" element={<UserPassword />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
