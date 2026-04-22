import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiUploadCloud, FiArrowRight } from "react-icons/fi";
import { LuMessageCircleWarning } from "react-icons/lu";
import socketManager from "./utils/socketManager";

function UserSettings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const room = searchParams.get("room") || "";
  const isCreating = searchParams.get("creating") === "true";
  
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    socketManager.connect();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if(file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("Please select a PNG or JPEG image");
      return;
    }
    if (file.size > 1024 * 1024 * 5) {
      setError("File size must be less than 5MB");
      return;
    }
    setProfileImage(file);
    setError("");
  };

  const handleSubmit = () => {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    if (isCreating) {
      // Creating room flow - go to create room page with user data
      const userData = {
        username: username.trim(),
        profileImage: profileImage ? URL.createObjectURL(profileImage) : null
      };
      navigate(`/createroom?userData=${encodeURIComponent(JSON.stringify(userData))}`);
    } else {
      // Joining room flow - proceed to game room
      let profileImageParam = '';
      if (profileImage) {
        if (profileImage instanceof File) {
          // Convert File object to blob URL
          profileImageParam = encodeURIComponent(URL.createObjectURL(profileImage));
          console.log('Converted File object to blob URL for navigation');
        } else {
          // Use existing URL or string
          profileImageParam = encodeURIComponent(profileImage);
        }
      }
      navigate(`/gameroom?room=${room}&username=${username.trim()}&profileImage=${profileImageParam}`);
    }
  };

  useEffect(() => {
    // Socket connection will be handled in GameRoom
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center background-pattern gap-4 py-4">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <h1 className="text-6xl font-bold text-center italic title-animation">
        <span className="text-gray-700">Player </span>
        <span className="text-[#6A1CF6]">Setup</span>
      </h1>

      <div className="text-center text-gray-700 subtitle-animation">
        <p>{isCreating ? "Configure your player profile before creating a room" : "Configure your player profile before joining"}</p>
        {room && <p className="text-sm mt-2">Room: <span className="font-mono font-bold">{room}</span></p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-8 w-full max-w-md bg-white shadow-lg flex flex-col gap-4 form-card-animation">
          {/* File type banner */}
          <div className="self-start rounded-full px-4 py-1 bg-[#EFDBFF]">
            <p className="text-[#6A1CF6] text-sm font-bold">
              OPTIONAL: JPG, PNG up to 5MB
            </p>
          </div>

          {/* Upload area */}
          <label
            className={`
              flex flex-col items-center justify-center
              h-64
              w-full
              rounded-2xl
              border-2
              border-dashed
              cursor-pointer
              transition
              ${profileImage 
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
            {profileImage ? (
              <>
                <p className="text-green-600 font-semibold text-center">
                  Profile image uploaded!
                </p>
                <p className="text-gray-500 text-sm">
                  Click to choose a different image
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-800 font-semibold text-center">
                  Upload profile picture
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
            />
          </label>

          {profileImage && (
            <div className="mt-4 flex justify-center">
              <img 
                src={URL.createObjectURL(profileImage)} 
                alt="Profile preview" 
                className="w-24 h-24 rounded-full object-cover border-4 border-[#6A1CF6]" 
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl p-8 w-full max-w-md bg-[#EFDBFF] shadow-lg flex flex-col gap-4 form-card-animation">
          {error && (
            <div className="error-message flex items-center gap-2">
              <LuMessageCircleWarning />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800">PLAYER NAME</label>
            <input
              type="text"
              placeholder="ENTER YOUR NAME"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field input-animation bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <button
              onClick={handleSubmit}
              className="rounded-4xl bg-[#6A1CF6] text-white p-4 font-bold flex items-center justify-center gap-2 button-hover"
              disabled={isSubmitting}
            >
              <div>{isSubmitting ? "Processing..." : (isCreating ? "Continue to Create Room" : "Join Game")}</div>
              <FiArrowRight />
            </button>

            <button
              onClick={() => navigate("/")}
              className="mt-2 px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 text-center"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserSettings;
