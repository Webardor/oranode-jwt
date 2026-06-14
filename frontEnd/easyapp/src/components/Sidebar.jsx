import { NavLink } from "react-router-dom";
import { FaHome, FaKey, FaUsers } from "react-icons/fa";

function Sidebar() {
  return (
    <div className="sidebar">

      <div className="logo">
        MISONE ERP
      </div>

      <NavLink
        to="/dashboard"
        className="menu-link"
      >
        <FaHome />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/user-profile"
        className="menu-link"
      >
        <FaUsers />
        <span>User Profile</span>
      </NavLink>

      <NavLink
        to="/user-password"
        className="menu-link"
      >
        <FaKey />
        <span>User Password</span>
      </NavLink>

    </div>
  );
}

export default Sidebar;
