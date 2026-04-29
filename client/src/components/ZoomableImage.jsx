import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import UserPawn from './UserPawn';

const ZoomableImage = ({ imageUrl, containerWidth, containerHeight, userPawns, currentUsername, onPawnMove, userProfiles = {} }) => {
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
    const stageRef = useRef(null);

  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.onload = () => {
        // Calculate initial scale to fit the image in the container
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const initialScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
        
        // Center the image
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        const initialX = (containerWidth - scaledWidth) / 2;
        const initialY = (containerHeight - scaledHeight) / 2;
        
        setImage(img);
        setScale(initialScale);
        setPosition({ x: initialX, y: initialY });
      };
      img.src = imageUrl;
    }
  }, [imageUrl, containerWidth, containerHeight]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const oldScale = scale;
    const pointer = stageRef.current.getPointerPosition();
    
    const mousePointTo = {
      x: pointer.x / oldScale - position.x / oldScale,
      y: pointer.y / oldScale - position.y / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Limit scale between 0.1 and 5
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    const newPos = {
      x: -(mousePointTo.x - pointer.x / clampedScale) * clampedScale,
      y: -(mousePointTo.y - pointer.y / clampedScale) * clampedScale,
    };
    
    setScale(clampedScale);
    setPosition(newPos);
  };

  const resetZoom = () => {
    if (image) {
      const scaleX = containerWidth / image.width;
      const scaleY = containerHeight / image.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      
      const scaledWidth = image.width * initialScale;
      const scaledHeight = image.height * initialScale;
      const initialX = (containerWidth - scaledWidth) / 2;
      const initialY = (containerHeight - scaledHeight) / 2;
      
      setScale(initialScale);
      setPosition({ x: initialX, y: initialY });
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 5);
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1);
    setScale(newScale);
  };

  if (!image) {
    return (
      <div className="flex  items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-gray-500">No map image available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={zoomIn}
          className="px-3 py-1 bg-white rounded shadow hover:bg-gray-100 transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="px-3 py-1 bg-white rounded shadow hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={resetZoom}
          className="px-3 py-1 bg-white rounded shadow hover:bg-gray-100 transition-colors"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>
      
      <Stage
        width={containerWidth}
        height={containerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        ref={stageRef}
        style={{ cursor: 'default' }}
      >
        <Layer>
          <KonvaImage
            image={image}
            width={image.width}
            height={image.height}
          />
        </Layer>
        
        {/* Pawn Layer */}
        <Layer>
          {Object.entries(userPawns || {}).map(([username, position]) => (
            <UserPawn
              key={username}
              user={username}
              position={position}
              isCurrentUser={username === currentUsername}
              userProfileImage={userProfiles[username] || null}
              onDragStart={() => {}}
              onDragMove={(e) => {
                if (username === currentUsername && onPawnMove) {
                  const newPos = {
                    x: e.target.x(),
                    y: e.target.y()
                  };
                  onPawnMove(newPos);
                }
              }}
              onDragEnd={(e) => {
                if (username === currentUsername && onPawnMove) {
                  const newPos = {
                    x: e.target.x(),
                    y: e.target.y()
                  };
                  onPawnMove(newPos);
                }
              }}
            />
          ))}
        </Layer>
      </Stage>
      
      <div className="absolute bottom-4 left-4 bg-white px-2 py-1 rounded shadow text-sm">
        Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

export default ZoomableImage;
