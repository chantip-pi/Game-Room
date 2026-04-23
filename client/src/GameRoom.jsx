import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiCopy, FiCheck } from "react-icons/fi";
import socketManager from "./utils/socketManager";
import ZoomableImage from './components/ZoomableImage';
import UserPawn from './components/UserPawn';
import { Stage, Layer, Rect, Text } from 'react-konva';

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
  const [profileImageUploaded, setProfileImageUploaded] = useState(false);
  const messagesEndRef = useRef(null);
  const gameAreaRef = useRef(null);

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

    // Only join room once
    if (!isJoined) {
      console.log(`Emitting join_room for ${username} with profileImage: ${profileImageParam ? 'YES (' + profileImageParam.substring(0, 50) + '...)' : 'NO'}`);
      socketManager.emit("join_room", { username, room, profileImage: profileImageParam });
    }

    // Handle profile image upload (only once)
    const handleProfileImageUpload = async () => {
      console.log(`Profile image upload triggered for ${username}, profileImageParam: ${profileImageParam ? 'YES (' + profileImageParam.substring(0, 50) + '...)' : 'NO'}, alreadyUploaded: ${profileImageUploaded}`);
      
      // Prevent multiple uploads
      if (profileImageUploaded) {
        console.log(`Profile image already uploaded for ${username}, skipping`);
        return;
      }

      let blobUrl = profileImageParam;

      // Handle File objects (including string representations from URL params)
      if (profileImageParam) {
        // Check if it's a string representation of a File object
        if (typeof profileImageParam === 'string' && profileImageParam.includes('[object File]')) {
          console.log(`Detected File object string representation for ${username} - this shouldn't happen, skipping upload`);
          // This is a string representation, not a real File object
          setUserProfiles(prev => ({
            ...prev,
            [username]: null
          }));
          setProfileImageUploaded(true);
          return;
        }
        
        // Check if it's an actual File object
        if (profileImageParam instanceof File) {
          console.log(`Converting File object to blob URL for ${username}`);
          blobUrl = URL.createObjectURL(profileImageParam);
          console.log(`Created blob URL: ${blobUrl}`);
        }
      }

      if (!blobUrl || !blobUrl.startsWith('blob:')) {
        console.log(`Profile image for ${username} is not a blob URL, using as-is: ${blobUrl}`);
        // Not a blob URL, use as-is
        setUserProfiles(prev => ({
          ...prev,
          [username]: blobUrl
        }));
        setProfileImageUploaded(true);
        return;
      }

      console.log(`Starting profile image upload for ${username} from blob URL`);
      try {
        // Convert blob to file and upload to server
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        
        // Use actual MIME type from blob
        const actualMimeType = blob.type || 'image/jpeg';
        const extension = actualMimeType === 'image/png' ? '.png' : '.jpg';
        const filename = `profile${extension}`;
        
        const file = new File([blob], filename, { type: actualMimeType });
        
        console.log(`Uploading profile image for ${username}: ${filename}, type: ${actualMimeType}`);
        
        // Upload profile image to server
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageData = e.target.result;
            console.log(`Emitting upload_profile_image for ${username}`);
            socketManager.emit("upload_profile_image", {
              imageData,
              filename,
              mimetype: actualMimeType
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
        
        setProfileImageUploaded(true);
        console.log(`Profile image upload initiated for ${username}`);
      } catch (error) {
        console.error('Failed to upload profile image:', error);
      }
    };

    // Handle profile image upload completion
    socketManager.on("profile_image_uploaded", (data) => {
      setUserProfiles(prev => ({
        ...prev,
        [username]: data.url
      }));
    });

    // Trigger profile image upload when room is joined
    const handleRoomJoined = () => {
      setIsJoined(true);
      setError("");
      handleProfileImageUpload();
    };

    // Listen for socket events
    socketManager.on("room_joined", (data) => {
      handleRoomJoined();
    });

    // Listen for profile image updates
    socketManager.on("user_profile_update", (data) => {
      console.log(`Received profile update for ${data.username}: ${data.profileImage}`);
      if (data.username !== username) {
        setUserProfiles(prev => ({
          ...prev,
          [data.username]: data.profileImage
        }));
        console.log(`Updated profile for ${data.username} in UI`);
      } else {
        console.log(`Ignoring own profile update for ${data.username}`);
      }
    });

    // Listen for existing user profiles when joining
    socketManager.on("existing_user_profiles", (data) => {
      if (data.profiles) {
        setUserProfiles(prev => ({
          ...prev,
          ...data.profiles
        }));
      }
    });

    // Listen for user profile removal
    socketManager.on("user_profile_remove", (data) => {
      if (data.username !== username) {
        setUserProfiles(prev => {
          const newProfiles = { ...prev };
          delete newProfiles[data.username];
          return newProfiles;
        });
      }
    });

    // Listen for profile check broadcasts when new users join
    socketManager.on("check_room_profiles", (data) => {
      console.log(`Profile check broadcast received in room ${data.room}:`, data);
      if (data.allProfiles) {
        console.log(`Updating all profiles from broadcast:`, data.allProfiles);
        setUserProfiles(prev => ({
          ...prev,
          ...data.allProfiles
        }));
      }
    });

    socketManager.on("chat_history", (data) => {
      setMessages(data.messages || []);
    });

    socketManager.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socketManager.on("update_users", (users) => {
      setOnlineUsers(users);
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

    socketManager.on("error", (data) => {
      setError(data.message);
      if (data.message.includes("does not exist")) {
        setTimeout(() => navigate("/"), 2000);
      }
    });

    socketManager.on("room_info", (roomInfo) => {
      if (roomInfo.mapDataUrl) {
        setMapUrl(roomInfo.mapDataUrl);
      }
    });

    socketManager.on("map_image_updated", (data) => {
      if (data.url) {
        setMapUrl(data.url);
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
      socketManager.off("room_info");
      socketManager.off("user_profile_update");
      socketManager.off("existing_user_profiles");
      socketManager.off("user_profile_remove");
      socketManager.off("profile_image_uploaded");
      socketManager.off("map_image_updated");
      socketManager.off("check_room_profiles");
    };
  }, [room, username, navigate]);

  useEffect(() => {
    const updateGameAreaSize = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setGameAreaSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateGameAreaSize();
    window.addEventListener('resize', updateGameAreaSize);

    return () => {
      window.removeEventListener('resize', updateGameAreaSize);
    };
  }, []);

  // Set map URL from URL parameters for room creator
  useEffect(() => {
    if (mapDataParam) {
      try {
        const decodedMapUrl = decodeURIComponent(mapDataParam);
        if (decodedMapUrl && decodedMapUrl !== 'null' && decodedMapUrl !== '') {
          setMapUrl(decodedMapUrl);
        }
      } catch (error) {
        setError('Error decoding map data from URL');
      }
    }
  }, [mapDataParam]);

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

  // Initialize pawn position when user joins
  useEffect(() => {
    if (isJoined && username) {
      // Set initial position for current user if not already set
      if (!userPawns[username]) {
        const initialPosition = {
          x: Math.random() * (gameAreaSize.width - 100) + 50,
          y: Math.random() * (gameAreaSize.height - 200) + 100
        };
        
        setUserPawns(prev => ({
          ...prev,
          [username]: initialPosition
        }));
        
        // Notify other users about initial position
        socketManager.emit("pawn_position", {
          room,
          username,
          position: initialPosition
        });
      }
    }
  }, [isJoined, username, gameAreaSize]);

  // Handle pawn movement
  const handlePawnMove = (newPosition) => {
    setUserPawns(prev => ({
      ...prev,
      [username]: newPosition
    }));
    
    // Broadcast position to other users
    socketManager.emit("pawn_position", {
      room,
      username,
      position: newPosition
    });
  };

  // Listen for pawn position updates from other users
  useEffect(() => {
    socketManager.on("pawn_position_update", (data) => {
      if (data.username !== username) {
        setUserPawns(prev => ({
          ...prev,
          [data.username]: data.position
        }));
      }
    });

    // Clean up pawns when users leave
    socketManager.on("user_left_pawn", (data) => {
      setUserPawns(prev => {
        const newPawns = { ...prev };
        delete newPawns[data.username];
        return newPawns;
      });
    });

    return () => {
      socketManager.off("pawn_position_update");
      socketManager.off("user_left_pawn");
    };
  }, [username]);

  if (!isJoined && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF3FF' }}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-[#EFDBFF]">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#6A1CF6' }}>Joining Room...</h2>
          <p className="text-gray-700 mb-2">Room: {room}</p>
          <p className="text-gray-700">Welcome: {username}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF3FF' }}>
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#EFDBFF] shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" style={{ color: '#6A1CF6' }}>Game Room:</h2>
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
          <span className="text-sm font-medium" style={{ color: '#6A1CF6' }}>{onlineUsers.length} online</span>
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

      <div className="grid grid-cols-12" style={{ height: 'calc(100vh - 73px)' }}>
        <div className="col-span-9 p-6" ref={gameAreaRef}>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Game Area</h3>
          <div className="bg-white rounded-lg border border-[#EFDBFF] shadow-sm overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
            {mapUrl ? (
              <ZoomableImage 
                imageUrl={mapUrl} 
                containerWidth={gameAreaSize.width - 48} // Account for padding
                containerHeight={gameAreaSize.height - 128} // Account for padding and header
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

        <div className="col-span-3 bg-white border-l border-[#EFDBFF] flex flex-col">
          <h3 className="px-4 py-3 font-semibold border-b border-[#EFDBFF] text-gray-700">Chat</h3>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 300px)' }}>
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
                      <span className="font-semibold text-sm" style={{ color: '#6A1CF6' }}>{msg.username}</span>
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
            <button onClick={sendMessage} className="px-4 py-2 font-medium rounded-lg transition-all duration-200 text-white" style={{ backgroundColor: '#6A1CF6' }}>
              Send
            </button>
          </div>

          {onlineUsers.length > 0 && (
            <div className="px-4 py-3 border-t border-[#EFDBFF]">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">Online Users:</h4>
              {onlineUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6A1CF6' }}></span>
                  {user.username || user}
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