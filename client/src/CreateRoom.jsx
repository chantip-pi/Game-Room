import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuCirclePlus, LuMessageCircleWarning } from "react-icons/lu";
import io from "socket.io-client";
import { FaDiceD20, FaDiceD6 } from "react-icons/fa";
import { GiD12 } from "react-icons/gi";

const socket = io.connect("http://localhost:3001");

function CreateRoom() {
  
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [dice, setDice] = useState("D6");
  const [playerCount, setPlayerCount] = useState(4);
  const [turnLimit, setTurnLimit] = useState(60);
  const navigate = useNavigate();

  const dices = [
    { id: "D6", icon: <FaDiceD6 size={32} /> },
    { id: "D12", icon: <GiD12 size={32} /> },
    { id: "D20", icon: <FaDiceD20 size={32} /> },
  ];
  const players = [4, 5, 6, 7, 8];

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
    socket.emit("create_room", { username, dice, playerCount, turnLimit });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center background-pattern gap-4 py-4">
      <div className="blob blob-1" />y
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <h1 className="text-6xl font-bold text-center italic title-animation">
        <span className="text-gray-700">Create </span>
        <span className="text-[#6A1CF6]">Room</span>
      </h1>

      <div className="text-center text-gray-700 subtitle-animation">
        <p>Create your own game room and invite friends to join</p>
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
            disabled={isCreating}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">ROOM SETTINGS</h3>

          <label className="block text-sm font-medium mb-2 text-gray-800">DICE</label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {dices.map((d) => (
              <button
                key={d.id}
                onClick={() => setDice(d.id)}
                className={`flex flex-col items-center justify-center rounded-lg border p-6 transition-all duration-200
                  ${dice === d.id
                    ? "border-[#6A1CF6] bg-[#6A1CF6] text-white"
                    : "border-gray-200 bg-white hover:border-[#6A1CF6] hover:bg-gray-100"
                  } focus:outline-none focus:ring-2 focus:ring-[#6A1CF6]`}
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
                />
                <p className="text-sm text-[#6A1CF6]">SECONDS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
      >
        {isCreating ? "Cancel" : "Back"}
      </button>
    </div>
  );
}

export default CreateRoom;