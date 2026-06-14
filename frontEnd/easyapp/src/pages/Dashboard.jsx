function Dashboard() {
  return (
    <div>

      <h1 className="page-title">
        DASHBOARD
      </h1>

      <div className="dashboard-cards">

        <div className="card">
          Total Users
          <h2>3</h2>
        </div>

        <div className="card">
          Active Users
          <h2>3</h2>
        </div>

        <div className="card">
          Inactive Users
          <h2>0</h2>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;