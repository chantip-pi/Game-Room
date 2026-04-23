import React from 'react';

const LoadingPage = ({ 
  title = 'Loading...', 
  subtitle = '', 
  room = '', 
  username = '',
  loadingItems = []
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF3FF' }}>
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-[#EFDBFF]">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#6A1CF6' }}>
          {title}
        </h2>
        
        {subtitle && <p className="text-gray-700 mb-2">{subtitle}</p>}
        {room && <p className="text-gray-700 mb-2">Room: {room}</p>}
        {username && <p className="text-gray-700 mb-4">Welcome: {username}</p>}
        
        {/* Loading spinner */}
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A1CF6]"></div>
        </div>
        
        {/* Loading status */}
        {loadingItems.length > 0 && (
          <div className="text-sm text-gray-600 space-y-1">
            {loadingItems.map((item, index) => (
              <p key={index} className={item.completed ? 'text-green-600' : 'text-gray-400'}>
                {item.completed ? '✓' : '○'} {item.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingPage;
