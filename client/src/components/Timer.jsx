import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import socketManager from '../utils/socketManager';

const Timer = ({ turnLimit, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState(turnLimit || 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(turnLimit || 60);
  const [error, setError] = useState(null);
  const roomRef = useRef(null);

  // Get room from location state
  const location = useLocation();
  useEffect(() => {
    try {
      const stateData = location.state || {};
      // Only set room if it's not already set to prevent unnecessary updates
      if (!roomRef.current && stateData.room) {
        roomRef.current = stateData.room;
        console.log('Timer: Room detected:', roomRef.current);
      }
      console.log('Timer: Turn limit:', turnLimit);
    } catch (err) {
      console.error('Error getting room from location state:', err);
      setError('Failed to get room information');
    }
  }, [turnLimit, location.state]);

  // Timer is now controlled by server-side socket events
  // No local timer logic needed - all updates come from server

  // Socket event listeners for synchronization
  useEffect(() => {
    if (!socketManager || !roomRef.current) {
      console.log('Timer: No socket manager or room available');
      return;
    }

    console.log('Timer: Setting up socket listeners for room:', roomRef.current);

    const handleTimerStart = (data) => {
      try {
        const { timeLeft, totalTime, isRunning } = data || {};
        console.log('Timer: Received timer_start event', data);
        setTimeLeft(timeLeft || 0);
        setTotalTime(totalTime || 0);
        setIsRunning(isRunning || false);
      } catch (err) {
        console.error('Error handling timer start:', err);
      }
    };

    const handleTimerUpdate = (data) => {
      try {
        const { timeLeft, totalTime, isRunning } = data || {};
        setTimeLeft(timeLeft || 0);
        setTotalTime(totalTime || 0);
        setIsRunning(isRunning || false);
      } catch (err) {
        console.error('Error handling timer update:', err);
      }
    };

    const handleTimerStop = (data) => {
      try {
        const { timeLeft, totalTime, isRunning } = data || {};
        setTimeLeft(timeLeft || 0);
        setTotalTime(totalTime || 0);
        setIsRunning(isRunning || false);
      } catch (err) {
        console.error('Error handling timer stop:', err);
      }
    };

    const handleTimerReset = (data) => {
      try {
        const { timeLeft, totalTime, isRunning } = data || {};
        setTimeLeft(timeLeft || 0);
        setTotalTime(totalTime || 0);
        setIsRunning(isRunning || false);
      } catch (err) {
        console.error('Error handling timer reset:', err);
      }
    };

    const handleTimerEnd = (data) => {
      try {
        const { timeLeft, totalTime, isRunning } = data || {};
        console.log('Timer: Received timer_end event', data);
        setTimeLeft(timeLeft || 0);
        setTotalTime(totalTime || 0);
        setIsRunning(isRunning || false);
      } catch (err) {
        console.error('Error handling timer end:', err);
      }
    };

    const handleTimerState = (data) => {
      try {
        const { timeLeft, totalTime, isRunning } = data || {};
        console.log('Timer: Received timer_state event', data);
        setTimeLeft(timeLeft || 0);
        setTotalTime(totalTime || 0);
        setIsRunning(isRunning || false);
      } catch (err) {
        console.error('Error handling timer state:', err);
      }
    };

    // Register event listeners
    socketManager.on('timer_start', handleTimerStart);
    socketManager.on('timer_update', handleTimerUpdate);
    socketManager.on('timer_stop', handleTimerStop);
    socketManager.on('timer_reset', handleTimerReset);
    socketManager.on('timer_end', handleTimerEnd);
    socketManager.on('timer_state', handleTimerState);

    // Cleanup
    return () => {
      if (socketManager) {
        socketManager.off('timer_start', handleTimerStart);
        socketManager.off('timer_update', handleTimerUpdate);
        socketManager.off('timer_stop', handleTimerStop);
        socketManager.off('timer_reset', handleTimerReset);
        socketManager.off('timer_end', handleTimerEnd);
        socketManager.off('timer_state', handleTimerState);
      }
    };
  }, []);

  // Request current timer state when room becomes available (runs once)
  useEffect(() => {
    if (socketManager && roomRef.current) {
      socketManager.emit('get_timer_state', { room: roomRef.current });
    }
  }, []); // Empty dependency array to run only once

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 0) return "text-red-600";
    if (timeLeft <= 10) return "text-orange-500";
    if (timeLeft <= 30) return "text-yellow-500";
    return "text-green-600";
  };

  const getTimerBgColor = () => {
    if (timeLeft <= 0) return "bg-red-100 border-red-300";
    if (timeLeft <= 10) return "bg-orange-100 border-orange-300";
    if (timeLeft <= 30) return "bg-yellow-100 border-yellow-300";
    return "bg-green-100 border-green-300";
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-red-100 ${className}`}>
        <span className="text-red-600 text-sm">Timer Error</span>
      </div>
    );
  }

  // Show placeholder if no turn limit
  if (!turnLimit || turnLimit <= 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 ${className}`}>
        <span className="text-gray-500 text-sm">No Timer Set</span>
      </div>
    );
  }

  const handleStart = () => {
    console.log('Timer: Start button clicked, emitting start_timer event');
    if (roomRef.current && socketManager) {
      socketManager.emit('start_timer', { room: roomRef.current });
    }
  };

  const handleStop = () => {
    console.log('Timer: Stop button clicked, emitting stop_timer event');
    if (roomRef.current && socketManager) {
      socketManager.emit('stop_timer', { room: roomRef.current });
    }
  };

  const handleReset = () => {
    console.log('Timer: Reset button clicked, emitting reset_timer event');
    if (roomRef.current && socketManager) {
      socketManager.emit('reset_timer', { room: roomRef.current });
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg border ${getTimerBgColor()} ${className}`}>

      <span className={`font-mono text-2xl font-semibold ${getTimerColor()}`}>
        {formatTime(timeLeft)}
      </span>
      {timeLeft <= 10 && timeLeft > 0 && (
        <span className="text-xs text-red-600 font-medium animate-pulse">
          Time running out!
        </span>
      )}
      <div className="flex gap-1">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors duration-200"
            title="Start Timer"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
            title="Stop Timer"
          >
            Stop
          </button>
        )}
        <button
          onClick={handleReset}
          className="mt-2 px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded transition-colors duration-200"
          title="Reset Timer"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;
