function UserPasswordModal({
  isOpen,
  mode,
  formData,
  onChange,
  onClose,
  onSave
}) {
  if (!isOpen) return null;

  const isCreateMode = mode === "create";

  return (
    <div className="modal-overlay">
      <div className="modal-box password-modal-box">
        <div className="modal-header">
          <h2>
            {isCreateMode ? "CREATE USER PASSWORD" : "MANAGE USER PASSWORD"}
          </h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="modal-body">
          {isCreateMode ? (
            <div className="form-group">
              <label>User ID</label>

              <input
                type="number"
                name="userId"
                value={formData.userId}
                onChange={onChange}
                min="1"
                placeholder="Enter existing user ID"
              />
            </div>
          ) : (
            <div className="password-summary">
              <div>
                <span>User</span>
                <strong>{formData.userName || "Unassigned user"}</strong>
              </div>

              <div>
                <span>Login ID</span>
                <strong>{formData.loginId || "-"}</strong>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Active Status</label>

            <select
              name="isActive"
              value={formData.isActive}
              onChange={onChange}
            >
              <option value="1">ACTIVE</option>
              <option value="0">INACTIVE</option>
            </select>
          </div>

          <div className="form-group">
            <label>{isCreateMode ? "Password" : "New Password"}</label>

            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={onChange}
              placeholder={
                isCreateMode
                  ? "Enter password"
                  : "Leave blank to keep current password"
              }
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="save-btn"
            onClick={onSave}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserPasswordModal;
