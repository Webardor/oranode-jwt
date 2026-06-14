function UserPasswordModal({
  isOpen,
  formData,
  onChange,
  onClose,
  onSave
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box password-modal-box">
        <div className="modal-header">
          <h2>MANAGE USER PASSWORD</h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="modal-body">
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
            <label>New Password</label>

            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={onChange}
              placeholder="Leave blank to keep current password"
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
