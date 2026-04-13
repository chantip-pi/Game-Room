import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuCirclePlus } from "react-icons/lu";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3001");

function CreateRoom() {
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("room_created", (data) => {
      setIsCreating(false);
      navigate(`/gameroom?room=${data.roomCode}&username=${username}`);
    });

    socket.on("error", (data) => {
      setIsCreating(false);
      setError(data.message);
    });

    return () => {
      socket.off("room_created");
      socket.off("error");
    };
  }, [username, navigate]);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsCreating(true);
    setError("");
    socket.emit("create_room", { username });
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="create-room-container">
      <div className="create-room-card">
        <h1>Create Room</h1>
        <p>Set up your game room</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Your Name:</label>
          <input
            type="text"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            disabled={isCreating}
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleCreateRoom} 
            className="create-button"
            disabled={isCreating}
          >
            <LuCirclePlus />
            <div>{isCreating ? "Creating..." : "Create Room"}</div>
          </button>
        </div>

        <button onClick={handleBack} className="back-button">
          {isCreating ? "Cancel" : "Back"}
        </button>
      </div>
    </div>
  );
}

export default CreateRoom;