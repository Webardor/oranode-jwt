import { NavLink } from "react-router-dom";
import { FaHome, FaUsers } from "react-icons/fa";

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

    </div>
  );
}

export default Sidebar;