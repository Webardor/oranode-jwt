import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../css/layout.css";

function MainLayout() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="main-area">
        <Header />

        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;