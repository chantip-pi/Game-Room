import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiCopy, FiCheck } from "react-icons/fi";
import socketManager from "./utils/socketManager";

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
  const [copied, setCopied] = useState(false);
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
    socketManager.emit("join_room", { username, room });

    // Listen for socket events
    socketManager.on("room_joined", (data) => {
      setIsJoined(true);
      setError("");
    });

    socketManager.on("chat_history", (data) => {
      setMessages(data.messages || []);
    });

    socketManager.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socketManager.on("user_joined", (data) => {
      setMessages((prev) => [...prev, {
        message: `${data.username} joined the room`,
        type: "system",
        timestamp: new Date().toISOString()
      }]);
    });

    socketManager.on("user_left", (data) => {
      setMessages((prev) => [...prev, {
        message: `${data.username} left the room`,
        type: "system",
        timestamp: new Date().toISOString()
      }]);
    });

    socketManager.on("update_users", (users) => {
      setOnlineUsers(users);
    });

    socketManager.on("error", (data) => {
      setError(data.message);
      if (data.message.includes("does not exist")) {
        setTimeout(() => navigate("/"), 2000);
      }
    });

    return () => {
      socketManager.off("room_joined");
      socketManager.off("chat_history");
      socketManager.off("receive_message");
      socketManager.off("user_joined");
      socketManager.off("user_left");
      socketManager.off("update_users");
      socketManager.off("error");
    };
  }, [room, username, navigate]);

  const handleLeaveRoom = () => {
    socketManager.emit("leave_room", { room, username });
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
      socketManager.emit("send_message", messageData);
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

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isJoined && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FDF3FF'}}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-[#EFDBFF]">
          <h2 className="text-2xl font-bold mb-4" style={{color: '#6A1CF6'}}>Joining Room...</h2>
          <p className="text-gray-700 mb-2">Room: {room}</p>
          <p className="text-gray-700">Welcome: {username}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FDF3FF'}}>
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#EFDBFF] shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" style={{color: '#6A1CF6'}}>Game Room:</h2>
          <div className="flex items-center gap-1 bg-[#EFDBFF] px-3 py-1 rounded-lg">
            <span className="font-mono text-sm font-medium text-gray-700">{room}</span>
            <button
              onClick={handleCopyRoomCode}
              className="p-1 rounded hover:bg-[#6A1CF6] hover:text-white transition-colors duration-200"
              title="Copy room code"
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">User: {username}</span>
          <span className="text-sm font-medium" style={{color: '#6A1CF6'}}>{onlineUsers.length} online</span>
        </div>
        <button onClick={handleLeaveRoom} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200">
          Leave Room
        </button>
      </div>
      
      {error && (
        <div className="w-full p-3 bg-red-100 text-red-800 rounded-lg mb-4 mx-6 mt-4">
          {error}
        </div>
      )}
      
      {copied && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <FiCheck size={16} />
          <span className="text-sm font-medium">Room code copied!</span>
        </div>
      )}
      
      <div className="flex" style={{height: 'calc(100vh - 73px)'}}>
        <div className="flex-1 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Game Area</h3>
          <p className="text-gray-600 mb-4">Your game content will go here</p>
          <div className="bg-white rounded-lg p-8 text-center border border-[#EFDBFF] shadow-sm">
            <p className="text-gray-500">Game mechanics would be implemented here</p>
          </div>
        </div>
        
        <div className="w-80 bg-white border-l border-[#EFDBFF] flex flex-col">
          <h3 className="px-4 py-3 font-semibold border-b border-[#EFDBFF] text-gray-700">Chat</h3>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxHeight: 'calc(100vh - 300px)'}}>
            {messages.map((msg, index) => (
              <div key={index} className="break-words">
                {msg.type === 'system' ? (
                  <div className="text-center text-sm text-gray-500 py-2">
                    {msg.message}
                    <span className="text-xs text-gray-400 ml-2">{formatTime(msg.timestamp)}</span>
                  </div>
                ) : (
                  <div className="bg-[#EFDBFF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm" style={{color: '#6A1CF6'}}>{msg.username}</span>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="text-gray-700">{msg.message}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-[#EFDBFF] flex gap-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 px-3 py-2 bg-gray-50 border border-[#EFDBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A1CF6] focus:border-transparent placeholder-gray-500 text-gray-700"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={sendMessage} className="px-4 py-2 font-medium rounded-lg transition-all duration-200 text-white" style={{backgroundColor: '#6A1CF6'}}>
              Send
            </button>
          </div>
          
          {onlineUsers.length > 0 && (
            <div className="px-4 py-3 border-t border-[#EFDBFF]">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">Online Users:</h4>
              {onlineUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#6A1CF6'}}></span>
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