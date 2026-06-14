import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

function Header() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userName = user?.userName || user?.loginId || "User";

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="header">

      <div className="header-left">
        MISONE ERP
      </div>

      <div className="header-right">
        <div className="user-menu">
          <button
            type="button"
            className="user-menu-button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-expanded={isMenuOpen}
          >
            <FaUserCircle />
            <span>{userName}</span>
            <FaChevronDown className="user-menu-chevron" />
          </button>

          {isMenuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-menu-summary">
                <strong>{userName}</strong>
                <span>{user?.loginId}</span>
              </div>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Header;
