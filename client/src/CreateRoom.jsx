import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuCirclePlus, LuMessageCircleWarning } from "react-icons/lu";
import { FaDiceD20, FaDiceD6 } from "react-icons/fa";
import { GiD12 } from "react-icons/gi";
import { useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";
import socketManager from "./utils/socketManager";

function CreateRoom() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [dice, setDice] = useState("D6");
  const [playerCount, setPlayerCount] = useState(4);
  const [turnLimit, setTurnLimit] = useState(60);
  const [map, setMap] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const userDataParam = searchParams.get("userData");
  const [userData, setUserData] = useState(null);

  const dices = [
    { id: "D6", icon: <FaDiceD6 size={32} /> },
    { id: "D12", icon: <GiD12 size={32} /> },
    { id: "D20", icon: <FaDiceD20 size={32} /> },
  ];
  const players = [4, 5, 6, 7, 8];

  useEffect(() => {
    // Parse user data if coming from UserSettings
    if (userDataParam) {
      try {
        const parsedUserData = JSON.parse(decodeURIComponent(userDataParam));
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/');
        return;
      }
    } else {
      // If no user data, redirect to UserSettings
      navigate('/usersettings?creating=true');
      return;
    }

    socketManager.connect();

    socketManager.on("room_created", (data) => {
      setIsCreating(false);
      console.log('Room created, uploading map...');
      
      // Upload the pending map if it exists
      if (window.pendingMapUpload) {
        socketManager.emit("upload_map_image", window.pendingMapUpload);
        delete window.pendingMapUpload; // Clean up
      }
    });

    socketManager.on("map_image_uploaded", (data) => {
      const profileImageParam = userData.profileImage ? encodeURIComponent(userData.profileImage) : '';
      navigate(`/gameroom?room=${data.roomCode}&username=${userData.username}&profileImage=${profileImageParam}`);
    });

    socketManager.on("error", (data) => {
      setIsCreating(false);
      setError(data.message);
    });

    return () => {
      socketManager.off("room_created");
      socketManager.off("map_image_uploaded");
      socketManager.off("error");
    };
  }, [userDataParam, navigate, userData?.username]);

  const handleCreateRoom = () => {
    if (!userData || !userData.username.trim()) {
      setError("User data not found. Please go back and set up your profile.");
      return;
    }
    
    if (!map) {
      setError("Please upload a map image to create a room");
      return;
    }
    
    setIsCreating(true);
    setError("");
    
    // Upload map to Cloudinary first, then create room
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const mapDataUrl = e.target.result;
        
        // Store map data for upload after room creation
        window.pendingMapUpload = {
          imageData: mapDataUrl,
          filename: 'map.jpg',
          mimetype: 'image/jpeg'
        };
        
        // Create room first without map
        socketManager.emit("create_room", { 
          username: userData.username, 
          dice, 
          playerCount, 
          turnLimit, 
          mapDataUrl: null // Will be uploaded separately
        });
        
      } catch (error) {
        console.error('Error creating room:', error);
        setError('Failed to create room');
        setIsCreating(false);
      }
    };
    reader.readAsDataURL(map);
  };

  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    console.log(file.type);

    if (!file) return;

    if(file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("Please select a PNG or JPEG image");
      return;
    }
    if (file.size > 1024 * 1024 * 10) {
      setError("File size must be less than 10MB");
      return;
    }
    setMap(file);
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center background-pattern gap-4 py-4">

      <h1 className="text-6xl font-bold text-center italic title-animation">
        <span className="text-gray-700">Create </span>
        <span className="text-[#6A1CF6]">Room</span>
      </h1>

      <div className="text-center text-gray-700 subtitle-animation">
        <p>Create your own game room and invite friends to join</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
       
 <div className="rounded-2xl p-8 w-full max-w-md bg-white shadow-lg flex flex-col gap-4 form-card-animation">
      
      {/* File type banner */}
      <div className="self-start rounded-full px-4 py-1 bg-[#EFDBFF]">
        <p className="text-[#6A1CF6] text-sm font-bold">
          REQUIRED: JPG, PNG up to 10MB
        </p>
      </div>

      {/* Upload area */}
      <label
        className={`
          flex flex-col items-center justify-center
          h-80
          w-full
          rounded-2xl
          border-2
          border-dashed
          ${isCreating ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          transition
          ${map 
            ? "border-green-500 bg-green-50 hover:bg-green-100" 
            : "border-purple-300 bg-purple-50 hover:bg-purple-100"
          }
        `}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md mb-4">
          <FiUploadCloud className="text-purple-600" size={28} />
        </div>

        {/* Text */}
        {map ? (
          <>
            <p className="text-green-600 font-semibold text-center">
              Map uploaded successfully!
            </p>
            <p className="text-gray-500 text-sm">
              Click to choose a different map
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-800 font-semibold text-center">
              Drag and drop your custom map
            </p>
            <p className="text-gray-500 text-sm">
              or click to browse local files
            </p>
          </>
        )}

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isCreating}
        />
      </label>
    </div>

        <div className="rounded-2xl p-8 w-full max-w-md bg-[#EFDBFF] shadow-lg flex flex-col gap-4 form-card-animation">
          {error && (
            <div className="error-message flex items-center gap-2">
              <LuMessageCircleWarning />
              {error}
            </div>
          )}

          

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">ROOM SETTINGS</h3>

            <label className="block text-sm font-medium mb-2 text-gray-800">DICE</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {dices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDice(d.id)}
                  disabled={isCreating}
                  className={`flex flex-col items-center justify-center rounded-lg border p-6 transition-all duration-200
                  ${dice === d.id
                      ? "border-[#6A1CF6] bg-[#6A1CF6] text-white"
                      : "border-gray-200 bg-white hover:border-[#6A1CF6] hover:bg-gray-100"
                    } ${isCreating ? "opacity-50 cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-[#6A1CF6]`}
                >
                  {d.icon}
                  <p className="mt-2 font-semibold">{d.id}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-800">MAX PLAYERS</label>
                <div className="flex items-center gap-2">
                  <select
                    value={playerCount}
                    onChange={(e) => setPlayerCount(e.target.value)}
                    disabled={isCreating}
                    className="input-field input-animation bg-white"
                  >
                    {players.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <p className="text-sm text-[#6A1CF6]">PLAYERS</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-800">TURN LIMIT</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="60"
                    value={turnLimit}
                    onChange={(e) => setTurnLimit(e.target.value)}
                    className="input-field input-animation bg-white"
                    min="30"
                    max="600"
                    disabled={isCreating}
                  />
                  <p className="text-sm text-[#6A1CF6]">SECONDS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
{map && (
  <div className="mt-4 flex justify-center w-[30vw]">
    <img src={URL.createObjectURL(map)} alt="preview" className="max-w-full h-auto rounded-lg" />
  </div>
)}
      <button
        onClick={handleCreateRoom}
        className="rounded-4xl bg-[#6A1CF6] text-white p-4 font-bold flex items-center gap-2 button-hover"
        disabled={isCreating}
      >
        <LuCirclePlus />
        {isCreating ? "Creating..." : "Create Room"}
      </button>

      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 text-gray-400 hover:text-grey-400 transition-colors duration-200"
        disabled={isCreating}
      >
        {isCreating ? "Cancel" : "Back"}
      </button>
    </div>
  );
}

export default CreateRoom;