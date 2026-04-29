import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiCopy, FiCheck, FiMessageSquare, FiX } from "react-icons/fi";
import socketManager from "./utils/socketManager";
import ZoomableImage from './components/ZoomableImage';
import LoadingPage from './components/LoadingPage';
import ChatSection from './components/ChatSection';

function GameRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const room = searchParams.get("room") || "";
  const username = searchParams.get("username") || "";
  const mapDataParam = searchParams.get("mapData") || "";
  const profileImageParam = searchParams.get("profileImage") || "";

  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mapUrl, setMapUrl] = useState(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [userPawns, setUserPawns] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  const messagesEndRef = useRef(null);
  const gameAreaRef = useRef(null);
  const hasJoined = useRef(false); // ← prevents double-emit

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Decode map from URL params (for room creator)
  useEffect(() => {
    if (!mapDataParam) return;
    try {
      const decoded = decodeURIComponent(mapDataParam);
      if (decoded && decoded !== 'null') setMapUrl(decoded);
    } catch {
      setError('Error decoding map data from URL');
    }
  }, [mapDataParam]);

  // Game area resize
  useEffect(() => {
    const update = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setGameAreaSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Pawn position listeners
  useEffect(() => {
    socketManager.on("pawn_position_update", (data) => {
      if (data.username !== username) {
        setUserPawns(prev => ({ ...prev, [data.username]: data.position }));
      }
    });
    socketManager.on("user_left_pawn", (data) => {
      setUserPawns(prev => {
        const next = { ...prev };
        delete next[data.username];
        return next;
      });
    });
    return () => {
      socketManager.off("pawn_position_update");
      socketManager.off("user_left_pawn");
    };
  }, [username]);

  // Check if all essential data is loaded
  useEffect(() => {
    if (isJoined && onlineUsers.length > 0 && messages.length >= 0) {
      // Add a small delay to ensure all data has settled
      setTimeout(() => setDataLoaded(true), 100);
    }
  }, [isJoined, onlineUsers, messages]);

  // Main socket setup — runs once
  useEffect(() => {
    if (!room || !username) {
      navigate("/");
      return;
    }

    // Guard against StrictMode double-invoke and reconnects
    if (!hasJoined.current) {
      hasJoined.current = true;
      socketManager.emit("join_room", { username, room, profileImage: profileImageParam || null });
    }

    socketManager.on("room_joined", () => {
      setIsJoined(true);
      setError("");
    });

    socketManager.on("chat_history", (data) => {
      setMessages(data.messages || []);
    });

    socketManager.on("receive_message", (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketManager.on("update_users", (users) => {
      setOnlineUsers(users);
    });

    socketManager.on("user_joined", (data) => {
      const username = data?.username || 'Unknown User';
      setMessages(prev => [...prev, {
        message: `${username} joined the room`,
        type: "system",
        timestamp: new Date().toISOString()
      }]);
    });

    socketManager.on("user_left", (data) => {
      setMessages(prev => [...prev, {
        message: `${data.username} left the room`,
        type: "system",
        timestamp: new Date().toISOString()
      }]);
    });

    socketManager.on("room_info", (roomInfo) => {
      if (roomInfo.mapDataUrl) setMapUrl(roomInfo.mapDataUrl);
    });

    socketManager.on("map_image_updated", (data) => {
      if (data.url) setMapUrl(data.url);
    });

    socketManager.on("user_profile_update", (data) => {
      setUserProfiles(prev => ({ ...prev, [data.username]: data.profileImage }));
    });

    socketManager.on("existing_user_profiles", (data) => {
      if (data.profiles) setUserProfiles(prev => ({ ...prev, ...data.profiles }));
    });

    socketManager.on("user_profile_remove", (data) => {
      setUserProfiles(prev => {
        const next = { ...prev };
        delete next[data.username];
        return next;
      });
    });

    socketManager.on("existing_pawn_positions", (data) => {
      if (data.positions) {
        setUserPawns(prev => ({ ...prev, ...data.positions }));
      }
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
      socketManager.off("update_users");
      socketManager.off("user_joined");
      socketManager.off("user_left");
      socketManager.off("room_info");
      socketManager.off("map_image_updated");
      socketManager.off("user_profile_update");
      socketManager.off("existing_user_profiles");
      socketManager.off("user_profile_remove");
      socketManager.off("existing_pawn_positions");
      socketManager.off("error");
    };
  }, []); // ← empty deps, runs once

  // Initialize pawn after joining - use fixed starting position only for new users
  useEffect(() => {
    if (!isJoined || !username) return;
    
    // Only set initial position if user doesn't already have a pawn position
    if (!userPawns[username]) {
      const initial = {
        x: 30,
        y: 30
      };
      setUserPawns(prev => ({ ...prev, [username]: initial }));
      socketManager.emit("pawn_position", { room, username, position: initial });
    }
  }, [isJoined, username, userPawns]);

  const handlePawnMove = (newPosition) => {
    setUserPawns(prev => ({ ...prev, [username]: newPosition }));
    socketManager.emit("pawn_position", { room, username, position: newPosition });
  };

  const handleLeaveRoom = () => {
    socketManager.emit("leave_room", { room, username });
    navigate("/");
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socketManager.emit("send_message", { room, message: message.trim(), username, timestamp: new Date().toISOString() });
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  if (!isJoined || !dataLoaded) {
    const loadingItems = [
      { label: 'Connected to room', completed: isJoined },
      { label: 'Users loaded', completed: onlineUsers.length > 0 },
      { label: 'Chat loaded', completed: messages.length >= 0 }
    ];

    return (
      <LoadingPage
        title={!isJoined ? 'Joining Room...' : 'Loading Game Data...'}
        room={room}
        username={username}
        loadingItems={loadingItems}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF3FF' }}>
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#EFDBFF] shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" style={{ color: '#6A1CF6' }}>Game Room:</h2>
          <div className="flex items-center gap-1 bg-[#EFDBFF] px-3 py-1 rounded-lg">
            <span className="font-mono text-sm font-medium text-gray-700">{room}</span>
            <button onClick={handleCopyRoomCode} className="p-1 rounded hover:bg-[#6A1CF6] hover:text-white transition-colors duration-200" title="Copy room code">
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">User: {username}</span>
          <span className="text-sm font-medium" style={{ color: '#6A1CF6' }}>{onlineUsers.length} online</span>
          <button 
            onClick={toggleChat} 
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
          >
          {isChatVisible ? "Hide Chat" : "Show Chat"}
          </button>
          <button onClick={handleLeaveRoom} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200">
            Leave Room
          </button>
        </div>
      </div>

      {error && <div className="w-full p-3 bg-red-100 text-red-800 rounded-lg mb-4 mx-6 mt-4">{error}</div>}
      {copied && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <FiCheck size={16} /><span className="text-sm font-medium">Room code copied!</span>
        </div>
      )}

      <div className="grid grid-cols-12" style={{ height: 'calc(100vh - 73px)' }}>
        <div className={`p-6 ${isChatVisible ? 'col-span-9' : 'col-span-12'}`} ref={gameAreaRef}>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Game Area</h3>
          <div className="bg-white rounded-lg border border-[#EFDBFF] shadow-sm overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
            {mapUrl ? (
              <ZoomableImage
                imageUrl={mapUrl}
                containerWidth={gameAreaSize.width - (isChatVisible ? 48 : 24)}
                containerHeight={gameAreaSize.height - 128}
                userPawns={userPawns}
                currentUsername={username}
                userProfiles={userProfiles}
                onPawnMove={handlePawnMove}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No map image available</p>
                  <p className="text-sm text-gray-400">Create a room with a custom map to see it here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChatSection
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          onlineUsers={onlineUsers}
          formatTime={formatTime}
          isHidden={!isChatVisible}
        />
      </div>
    </div>
  );
}

export default GameRoom;