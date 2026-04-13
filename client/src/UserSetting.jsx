import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UserSetting() {
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const navigate = useNavigate();

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem("username", username);
    localStorage.setItem("theme", theme);
    localStorage.setItem("notifications", notifications);
    
    alert("Settings saved!");
    navigate("/");
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h1>User Settings</h1>
        <p>Customize your experience</p>
        
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            placeholder="Enter your username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="form-group">
          <label>Theme:</label>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="select-field"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            Enable Notifications
          </label>
        </div>

        <div className="button-group">
          <button onClick={handleSave} className="save-button">
            Save Settings
          </button>
        </div>

        <button onClick={handleBack} className="back-button">
          ← Back
        </button>
      </div>
    </div>
  );
}

export default UserSetting;