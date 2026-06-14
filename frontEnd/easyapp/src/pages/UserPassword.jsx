import { useEffect, useMemo, useState } from "react";
import { FaKey } from "react-icons/fa";

import UserPasswordModal from "../components/UserPasswordModal";

import {
  createPasswordRecord,
  getPasswordRecords,
  updatePasswordRecord
} from "../services/userPasswordService";

import "../css/userProfile.css";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function mapRecord(row) {
  return {
    userId: row.USER_ID,
    userName: row.USER_NAME,
    loginId: row.LOGIN_ID,
    passwordHashMasked: row.PASSWORD_HASH_MASKED,
    passwordCreated: row.PASSWORD_CREATED,
    passwordUpdated: row.PASSWORD_UPDATED,
    isActive: String(row.IS_ACTIVE ?? 0),
    newPassword: ""
  };
}

function UserPassword() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState("edit");
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    loginId: "",
    isActive: "1",
    newPassword: ""
  });

  useEffect(() => {
    loadRecords();
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

  const loadRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPasswordRecords();
      setRecords(data.map(mapRecord));
    } catch (error) {
      console.error(error);
      setRecords([]);
      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load password records"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    if (!term) return records;

    return records.filter((record) => (
      String(record.userId).includes(term) ||
      (record.userName || "").toLowerCase().includes(term) ||
      (record.loginId || "").toLowerCase().includes(term)
    ));
  }, [records, searchText]);

  const handleCreate = () => {
    setModalMode("create");
    setFormData({
      userId: "",
      userName: "",
      loginId: "",
      isActive: "1",
      newPassword: ""
    });
    setIsOpen(true);
  };

  const handleEdit = (record) => {
    setModalMode("edit");
    setFormData({
      ...record,
      newPassword: ""
    });
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
        isActive: Number(formData.isActive),
        newPassword: formData.newPassword
      };

      if (modalMode === "create") {
        await createPasswordRecord({
          ...payload,
          userId: Number(formData.userId)
        });
      } else {
        await updatePasswordRecord(formData.userId, payload);
      }

      await loadRecords();

      setIsOpen(false);
      showNotice("success",
        modalMode === "create"
          ? "Password record created successfully."
          : "Password record updated successfully."
      );
    } catch (error) {
      console.error(error);

      showNotice("error",
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        error.message
      );
    }
  };

  const getActiveClass = (isActive) => (
    isActive === "1" ? "status-active" : "status-inactive"
  );

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
        USER PASSWORDS
      </h1>

      <div className="report-container">
        <div className="report-toolbar password-toolbar">
          <input
            type="text"
            placeholder="Search by user, login ID, or user ID..."
            className="search-box password-search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            className="create-btn"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>

        {loading ? (
          <h3 className="report-message">Loading...</h3>
        ) : error ? (
          <div className="report-message report-error">
            {error}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="report-message">
            No password records found.
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Manage</th>
                <th>User ID</th>
                <th>User Name</th>
                <th>Login ID</th>
                <th>Password Hash</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.userId}>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(record)}
                      title="Manage password"
                    >
                      <FaKey />
                    </button>
                  </td>

                  <td>{record.userId}</td>
                  <td>{record.userName || "-"}</td>
                  <td>{record.loginId || "-"}</td>
                  <td>
                    <code className="hash-pill">
                      {record.passwordHashMasked}
                    </code>
                  </td>
                  <td>{formatDate(record.passwordCreated)}</td>
                  <td>{formatDate(record.passwordUpdated)}</td>
                  <td>
                    <span className={getActiveClass(record.isActive)}>
                      {record.isActive === "1" ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UserPasswordModal
        isOpen={isOpen}
        mode={modalMode}
        formData={formData}
        onChange={handleChange}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

export default UserPassword;
