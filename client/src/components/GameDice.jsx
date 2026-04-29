import React from 'react';
import { FaDiceD20, FaDiceD6 } from 'react-icons/fa';
import { GiD12 } from 'react-icons/gi';

const GameDice = ({ dice, className = "" }) => {
  const getDiceIcon = () => {
    switch (dice) {
      case 'D6':
        return <FaDiceD6 size={48} />;
      case 'D12':
        return <GiD12 size={48} />;
      case 'D20':
        return <FaDiceD20 size={48} />;
      default:
        return <FaDiceD6 size={48} />;
    }
  };

  return (
    <div className={`flex items-center justify-center p-4 rounded-lg border border-gray-300 bg-gray-100 ${className}`}>
      <div className="text-center">
        <div className="mb-2">
          {getDiceIcon()}
        </div>
        <div className="text-sm font-medium text-gray-600">
          {dice || 'D6'}
        </div>
      </div>
    </div>
  );
};

export default GameDice;
