import React, { useState, useEffect } from 'react';
import { FaDiceD20, FaDiceD6 } from 'react-icons/fa';
import { GiD12 } from 'react-icons/gi';
import socketManager from '../utils/socketManager';

const GameDice = ({ dice, className = "", onRoll }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [currentValue, setCurrentValue] = useState(null);
  const [displayValue, setDisplayValue] = useState('?');
  const [rollingUsername, setRollingUsername] = useState(null);

  // Listen for remote dice rolls
  useEffect(() => {
    const handleDiceRollStart = (data) => {
      setIsRolling(true);
      setDisplayValue('??');
      setRollingUsername(data.username);
      
      // Start rolling animation
      const maxValue = data.type === 'D6' ? 6 : data.type === 'D12' ? 12 : data.type === 'D20' ? 20 : 6;
      let rollCount = 0;
      const rollInterval = setInterval(() => {
        const tempValue = Math.floor(Math.random() * maxValue) + 1;
        setDisplayValue(tempValue);
        rollCount++;
        
        if (rollCount >= 10) {
          clearInterval(rollInterval);
        }
      }, 100);
      
      // Store interval ID to clear it when roll ends
      window.currentRollInterval = rollInterval;
    };

    const handleDiceRollEnd = (data) => {
      // Clear the rolling animation interval
      if (window.currentRollInterval) {
        clearInterval(window.currentRollInterval);
        window.currentRollInterval = null;
      }
      
      setCurrentValue(data.value);
      setDisplayValue(data.value);
      setIsRolling(false);
      setRollingUsername(null);
    };

    socketManager.on('dice_roll_start', handleDiceRollStart);
    socketManager.on('dice_roll_end', handleDiceRollEnd);

    return () => {
      socketManager.off('dice_roll_start', handleDiceRollStart);
      socketManager.off('dice_roll_end', handleDiceRollEnd);
      if (window.currentRollInterval) {
        clearInterval(window.currentRollInterval);
        window.currentRollInterval = null;
      }
    };
  }, []);

  const rollDice = () => {
    if (isRolling) return;

    // Generate random value based on dice type
    const maxValue = dice === 'D6' ? 6 : dice === 'D12' ? 12 : dice === 'D20' ? 20 : 6;
    const newValue = Math.floor(Math.random() * maxValue) + 1;

    // Emit dice roll to server - server will handle the animation timing
    if (onRoll) {
      onRoll({
        type: dice || 'D6',
        value: newValue,
        timestamp: new Date().toISOString()
      });
    }
  };

  const getDiceIcon = () => {
    if (isRolling) {
      return <div className="animate-spin text-4xl">🎲</div>;
    }
    
    switch (dice) {
      case 'D6':
        return <FaDiceD6 size={48} className={isRolling ? 'animate-bounce' : ''} />;
      case 'D12':
        return <GiD12 size={48} className={isRolling ? 'animate-bounce' : ''} />;
      case 'D20':
        return <FaDiceD20 size={48} className={isRolling ? 'animate-bounce' : ''} />;
      default:
        return <FaDiceD6 size={48} className={isRolling ? 'animate-bounce' : ''} />;
    }
  };

  const getDiceColor = () => {
    switch (dice) {
      case 'D6':
        return 'text-blue-500';
      case 'D12':
        return 'text-purple-500';
      case 'D20':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className={`flex flex-col items-center p-4 rounded-lg border-2 ${isRolling ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-100'} ${className}`}>
      <div className="text-center mb-3">
        <div className={`mb-2 ${getDiceColor()}`}>
          {getDiceIcon()}
        </div>
        <div className="text-sm font-medium text-gray-600 mb-2">
          {dice || 'D6'}
        </div>
      </div>
      
      {/* Display current roll value */}
      <div className={`text-3xl font-bold mb-3 ${isRolling ? 'animate-pulse text-yellow-600' : 'text-gray-800'}`}>
        {displayValue}
      </div>
      
      {/* Show who is rolling */}
      {isRolling && rollingUsername && (
        <div className="text-sm text-gray-600 mb-2 animate-pulse">
          {rollingUsername} is rolling...
        </div>
      )}
      
      {/* Roll button */}
      <button
        onClick={rollDice}
        disabled={isRolling}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          isRolling 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg transform hover:scale-105'
        }`}
      >
        {isRolling ? (rollingUsername ? `${rollingUsername} Rolling...` : 'Rolling...') : 'Roll Dice'}
      </button>
      
    </div>
  );
};

export default GameDice;
