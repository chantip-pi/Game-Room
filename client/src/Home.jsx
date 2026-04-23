import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { LuCirclePlus } from "react-icons/lu";
import { LuMessageCircleWarning } from "react-icons/lu";
import socketManager from "./utils/socketManager";

function Home() {
  const [room, setRoom] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Socket connection will be handled in UserSettings
  }, []);

  const joinRoom = async () => {
    if (!room.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3001/validate-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode: room.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate room');
      }

      if (!data.exists) {
        setError("Room does not exist. Please check the room code and try again.");
        return;
      }

      if (data.isFull) {
        setError(`Room is full (${data.userCount}/${data.maxPlayers} players). Please try a different room.`);
        return;
      }

      // Room exists and is not full, proceed to user settings
      navigate(`/usersettings?room=${data.roomCode}`);
    } catch (error) {
      console.error('Room validation error:', error);
      setError(error.message || 'Failed to validate room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center background-pattern gap-2">
       <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

       <div className="rounded-3xl p-3 bg-[#EFDBFF] gap-2 flex flex-col welcome-banner">
        <p className="text-center text-[#6A1CF6] text-sm font-bold">WELCOME TO GAMEROOM</p>
        </div>
      <h1 className="text-6xl font-bold text-center mb-2 italic title-animation">
        <span className="text-gray-700">Ready to </span>
        <span className="text-[#6A1CF6]">Play?</span>
      </h1>

      <div className="py-6">
        <p className="text-center text-gray-700 subtitle-animation">Enter a room code to join your friends</p>
        <p className="text-center text-gray-700 subtitle-animation">or host your own room</p>
      </div>

      <div className="rounded-2xl p-8 w-full max-w-md bg-white shadow-lg gap-2 flex flex-col form-card-animation">

        {error && <div className="error-message flex items-center gap-2">
          <LuMessageCircleWarning />
          {error}
          </div>}

        <input
          type="text"
          placeholder="ENTER ROOM CODE"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="input-field input-animation"
          disabled={isJoining}
        />
        <button onClick={joinRoom} className="rounded-4xl bg-[#6A1CF6] text-white p-4 font-bold flex items-center justify-center gap-2 button-hover" disabled={isJoining}>
          <div>{isJoining ? "Processing..." : "Join Game"}</div>
          <FaArrowRight />
        </button>

      </div>
      <div className="flex items-center justify-center my-6">
        <div className="border-t border-gray-300 flex-grow mr-3 divider-animation"></div>
        <span className="text-gray-700 px-4 font-medium">OR</span>
        <div className="border-t border-gray-300 flex-grow ml-3 divider-animation"></div>
      </div>
      <div>
        <Link to="/usersettings?creating=true" className="rounded-4xl bg-white text-white p-4 font-bold flex items-center justify-center shadow-lg gap-2 create-room-animation">
          <div className="bg-[#FDD400] rounded-4xl p-3">
           <div className="text-gray-700">
            <LuCirclePlus />
           </div>
            </div> 
           <div className="text-gray-700">Create Room</div>
        </Link>
      </div>
    </div>
  );
}

export default Home;