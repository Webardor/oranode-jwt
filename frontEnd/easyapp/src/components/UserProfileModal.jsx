function UserProfileModal({
  isOpen,
  mode,
  formData,
  onChange,
  onClose,
  onSave,
  onDelete
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">

      <div className="modal-box">

        <div className="modal-header">

          <h2>
            {mode === "create"
              ? "CREATE USER PROFILE"
              : "EDIT USER PROFILE"}
          </h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <div className="modal-body">

          <div className="form-group">
            <label>User Name</label>

            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label>Login ID</label>

            <input
              type="text"
              name="loginId"
              value={formData.loginId}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label>Mobile No</label>

            <input
              type="text"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label>User Status</label>

            <select
              name="userStatus"
              value={formData.userStatus}
              onChange={onChange}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="LOCKED">LOCKED</option>
            </select>
          </div>

        </div>

        <div className="modal-footer">

          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          {mode === "edit" && (
            <button
              className="delete-btn"
              onClick={onDelete}
            >
              Delete
            </button>
          )}

          <button
            className="save-btn"
            onClick={onSave}
          >
            {mode === "create"
              ? "Create"
              : "Apply Changes"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default UserProfileModal;
