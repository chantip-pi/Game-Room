import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io.connect("http://localhost:3001");

function GameRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const room = searchParams.get("room") || "";
  const username = searchParams.get("username") || "";
  
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!room || !username) {
      navigate("/");
      return;
    }

    // Join the room
    socket.emit("join_room", { username, room });

    // Listen for socket events
    socket.on("room_joined", (data) => {
      setIsJoined(true);
      setError("");
    });

    socket.on("chat_history", (data) => {
      setMessages(data.messages || []);
    });

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("user_joined", (data) => {
      setMessages((prev) => [...prev, {
        message: `${data.username} joined the room`,
        type: "system",
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on("user_left", (data) => {
      setMessages((prev) => [...prev, {
        message: `${data.username} left the room`,
        type: "system",
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on("update_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("error", (data) => {
      setError(data.message);
      if (data.message.includes("does not exist")) {
        setTimeout(() => navigate("/"), 2000);
      }
    });

    return () => {
      socket.off("room_joined");
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("update_users");
      socket.off("error");
    };
  }, [room, username, navigate]);

  const handleLeaveRoom = () => {
    socket.emit("leave_room", { room, username });
    navigate("/");
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      const messageData = {
        room,
        message: message.trim(),
        username,
        timestamp: new Date().toISOString()
      };
      socket.emit("send_message", messageData);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isJoined && !error) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <h2>Joining Room...</h2>
          <p>Room: {room}</p>
          <p>Welcome: {username}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-room-container">
      <div className="game-header">
        <h2>Game Room: {room}</h2>
        <div className="header-info">
          <span className="user-info">User: {username}</span>
          <span className="online-count">{onlineUsers.length} online</span>
        </div>
        <button onClick={handleLeaveRoom} className="leave-button">
          Leave Room
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="game-content">
        <div className="game-area">
          <h3>Game Area</h3>
          <p>Your game content will go here</p>
          <div className="game-placeholder">
            <p>Game mechanics would be implemented here</p>
          </div>
        </div>
        
        <div className="chat-sidebar">
          <h3>Chat</h3>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type || 'user'}`}>
                {msg.type === 'system' ? (
                  <div className="system-message">
                    {msg.message}
                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                ) : (
                  <div className="user-message">
                    <div className="message-header">
                      <span className="message-username">{msg.username}</span>
                      <span className="timestamp">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
          
          {onlineUsers.length > 0 && (
            <div className="users-list">
              <h4>Online Users:</h4>
              {onlineUsers.map((user, index) => (
                <div key={index} className="user-item">
                  <span className="user-dot"></span>
                  {user}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameRoom;