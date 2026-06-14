import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";

import UserProfileModal from "../components/UserProfileModal";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from "../services/userProfileService";

import "../css/userProfile.css";

function UserProfile() {

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState(null);

  const [isOpen, setIsOpen] = useState(false);

  const [mode, setMode] = useState("create");

  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    loginId: "",
    emailAddress: "",
    mobileNo: "",
    userStatus: "ACTIVE"
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  const loadUsers = async () => {

    setLoading(true);
    setError("");

    try {

      const data = await getUsers();

      const mappedData = data.map((row) => ({
        userId: row.USER_ID,
        userName: row.USER_NAME,
        loginId: row.LOGIN_ID,
        emailAddress: row.EMAIL_ADDRESS,
        mobileNo: row.MOBILE_NO,
        userStatus: row.USER_STATUS
      }));

      setUsers(mappedData);

    } catch (error) {

      console.error(error);
      setUsers([]);
      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load users"
      );

    } finally {

      setLoading(false);

    }
  };

  const handleCreate = () => {

    setMode("create");

    setFormData({
      userId: "",
      userName: "",
      loginId: "",
      emailAddress: "",
      mobileNo: "",
      userStatus: "ACTIVE"
    });

    setIsOpen(true);
  };

  const handleEdit = (row) => {

    setMode("edit");

    setFormData(row);

    setIsOpen(true);
  };

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {

    try {

      const payload = {
        userName: formData.userName,
        loginId: formData.loginId,
        emailAddress: formData.emailAddress,
        mobileNo: formData.mobileNo,
        userStatus: formData.userStatus
      };

      if (mode === "create") {

        await createUser(payload);

        await loadUsers();

        setIsOpen(false);

        showNotice("success", "User created successfully.");
        return;
      }

      await updateUser(formData.userId, payload);

      await loadUsers();

      setIsOpen(false);

      showNotice("success", "User updated successfully.");

    } catch (error) {

      console.error(error);

      showNotice("error",
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        error.message
      );

    }

  };

  const handleDelete = async () => {

    try {

      await deleteUser(formData.userId);

      await loadUsers();

      setIsOpen(false);

      showNotice("success", "User deleted successfully.");

    } catch (error) {

      console.error(error);

      showNotice("error",
        error.response?.data?.message ||
        error.message
      );

    }

  };

  const getStatusClass = (status) => {
    if (status === "ACTIVE") return "status-active";
    if (status === "LOCKED") return "status-locked";
    return "status-inactive";
  };

  return (
    <div>

      {notice && (
        <div className={`toast-notice toast-${notice.type}`} role="status">
          <div>
            <strong>
              {notice.type === "success" ? "Success" : "Action needed"}
            </strong>
            <span>{notice.message}</span>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => setNotice(null)}
            aria-label="Close message"
          >
            x
          </button>
        </div>
      )}

      <h1 className="page-title">
        USERS REPORT
      </h1>

      <div className="report-container">

        <div className="report-toolbar">

          <input
            type="text"
            placeholder="Search..."
            className="search-box"
          />

          <button
            className="create-btn"
            onClick={handleCreate}
          >
            Create
          </button>

        </div>

        {loading ? (

          <h3>Loading...</h3>

        ) : error ? (

          <div className="report-message report-error">
            {error}
          </div>

        ) : users.length === 0 ? (

          <div className="report-message">
            No users found.
          </div>

        ) : (

          <table className="user-table">

            <thead>

              <tr>
                <th>Edit</th>
                <th>User Name</th>
                <th>Login ID</th>
                <th>Email Address</th>
                <th>Mobile No</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {users.map((row) => (

                <tr key={row.userId}>

                  <td>

                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(row)}
                    >
                      <FaEdit />
                    </button>

                  </td>

                  <td>{row.userName}</td>

                  <td>{row.loginId}</td>

                  <td>{row.emailAddress}</td>

                  <td>{row.mobileNo}</td>

                  <td>

                    <span className={getStatusClass(row.userStatus)}>
                      {row.userStatus}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      <UserProfileModal
        isOpen={isOpen}
        mode={mode}
        formData={formData}
        onChange={handleChange}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

    </div>
  );
}

export default UserProfile;
