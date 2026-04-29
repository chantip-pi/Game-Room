import React, { useRef, useEffect } from 'react';

const ChatSection = ({ 
  messages, 
  message, 
  setMessage, 
  sendMessage, 
  handleKeyPress, 
  onlineUsers, 
  formatTime
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div className="col-span-3 border-r border-gray-200 bg-white flex flex-col order-1 h-[40vh]">
      <h3 className="px-4 py-3 font-semibold border-b border-[#EFDBFF] text-gray-700">Chat</h3>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className="break-words">
            {msg.type === 'system' ? (
              <div className="text-center text-sm text-gray-500 py-2">
                {msg.content}
                <span className="text-xs text-gray-400 ml-2">{formatTime(msg.timestamp)}</span>
              </div>
            ) : (
              <div className="bg-[#EFDBFF] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm" style={{ color: '#6A1CF6' }}>{msg.username}</span>
                  <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="text-gray-700">{msg.content}</div>
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
  );
};

export default ChatSection;
