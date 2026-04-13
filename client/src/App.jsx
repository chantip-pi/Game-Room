import "./App.css";
import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
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

    socket.on("room_joined", (data) => {
      setIsJoined(true);
      setError("");
    });

    socket.on("room_created", (data) => {
      setRoom(data.roomCode);
      setIsJoined(true);
      setError("");
    });

    socket.on("chat_history", (data) => {
      setMessages(data.messages || []);
    });

    socket.on("error", (data) => {
      setError(data.message);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("update_users");
      socket.off("room_joined");
      socket.off("room_created");
      socket.off("chat_history");
      socket.off("error");
    };
  }, []);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", { username, room });
    }
  };

  const createRoom = () => {
    if (username !== "") {
      socket.emit("create_room", { username });
    }
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



  if (!isJoined) {
    return (
      <div className="join-container">
        <div className="join-card">
          <h1>Join Chat Room</h1>
          {error && <div className="error-message">{error}</div>}
          <input
            type="text"
            placeholder="Enter your username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Enter room code..."
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="input-field"
          />
          <button onClick={joinRoom} className="join-button">
            Join Room
          </button>
          <button onClick={createRoom} className="join-button">
            Create Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Room: {room}</h2>
        <div className="user-info">
          <span className="username">{username}</span>
          <span className="online-count">{onlineUsers.length} online</span>
        </div>
      </div>
      
      <div className="chat-main">
        <div className="messages-container">
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
        
        {onlineUsers.length > 0 && (
          <div className="users-sidebar">
            <h3>Online Users</h3>
            <ul className="users-list">
              {onlineUsers.map((user, index) => (
                <li key={index} className="user-item">
                  <span className="user-status"></span>
                  {user}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="message-input-container">
        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="message-input"
          rows={1}
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;