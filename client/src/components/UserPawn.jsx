import React, { useEffect, useState } from 'react';
import { Group, Text, Circle, Rect, Path, Image as KonvaImage } from 'react-konva';

const UserPawn = ({
  user,
  position,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  isCurrentUser,
  imageScale = 1,
  userProfileImage = null,
}) => {
  const BASE = 80;
  // Make current user pawn slightly larger
  const currentUserScale = isCurrentUser ? 1.1 : 1;
  const size = BASE * imageScale * currentUserScale;
  const r = size / 2;
  const cx = r;
  const cy = r;
  const sc = imageScale;
  const [profileImageObj, setProfileImageObj] = useState(null);

  const COLORS = [
    '#6A1CF6', '#ff0000', '#ff9900', '#004c5e', '#96CEB4',
    '#ffc400', '#ff3fff', '#9de8ff', '#ffffff', '#000000',
  ];
  const colorIdx = user.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;
  const color = COLORS[colorIdx];

  // Label metrics
  const fontSize = Math.round(12 * sc);
  const labelText = user;
  const pillPad = Math.round(6 * sc);
  const pillH = fontSize + pillPad * 2;
  const pillW = labelText.length * Math.round(7 * sc) + pillPad * 3;
  const pillY = size + Math.round(6 * sc);
  const pillX = cx - pillW / 2;

  // Load profile image if provided
  useEffect(() => {
    if (userProfileImage) {
      const img = new window.Image();
      img.onload = () => {
        setProfileImageObj(img);
      };
      img.onerror = () => {
        console.error('Failed to load profile image for user:', user);
        setProfileImageObj(null);
      };
      img.crossOrigin = 'anonymous';
      img.src = userProfileImage;
    } else {
      setProfileImageObj(null);
    }
  }, [userProfileImage, user]);

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={isCurrentUser}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      opacity={isDragging ? 0.85 : 1}
    >
      {/* Drop shadow layer */}
      <Circle
        x={cx + Math.round(2 * sc)}
        y={cy + Math.round(4 * sc)}
        radius={r - Math.round(3 * sc)}
        fill="rgba(0,0,0,0.25)"
      />

      {/* User color halo ring — makes the pawn pop on any background */}
      <Circle
        x={cx}
        y={cy}
        radius={r - Math.round(1 * sc)}
        fill={color}
        stroke={color}
        strokeWidth={Math.round(6 * sc)}
      />

      {/* Main circle - either profile image or colored circle */}
      {profileImageObj ? (
        <>
          <>
            <Circle
              x={cx}
              y={cy}
              radius={r}
              fillPatternImage={profileImageObj}
              fillPatternOffset={{
                x: profileImageObj ? profileImageObj.width / 2 : 0,
                y: profileImageObj ? profileImageObj.height / 2 : 0,
              }}
              fillPatternScale={{
                x:
                  profileImageObj
                    ? (r * 2) / profileImageObj.width
                    : 1,
                y:
                  profileImageObj
                    ? (r * 2) / profileImageObj.height
                    : 1,
              }}
              stroke={isCurrentUser ? color : `${color}59`}
              strokeWidth={isCurrentUser ? Math.round(3 * sc) : Math.round(1.5 * sc)}
            />
          </>
        </>
      ) : (
        <>
          <Circle
            x={cx}
            y={cy}
            radius={r - Math.round(4 * sc)}
            fill={color}
            stroke={isCurrentUser ? color : `${color}59`}
            strokeWidth={isCurrentUser ? Math.round(3 * sc) : Math.round(1.5 * sc)}
          />
          {/* User initial - fallback when no profile image */}
          <Text
            x={cx}
            y={cy}
            text={user.charAt(0).toUpperCase()}
            fontSize={Math.round(20 * sc)}
            fontStyle="bold"
            fill="white"
            align="center"
            verticalAlign="middle"
            offsetX={Math.round(10 * sc)}
            offsetY={Math.round(11 * sc)}
            shadowColor="rgba(0,0,0,0.4)"
            shadowBlur={Math.round(3 * sc)}
            shadowOffsetY={Math.round(1 * sc)}
            listening={false}
          />
        </>
      )}

      {/* Label pill background */}
      <Rect
        x={pillX}
        y={pillY}
        width={pillW}
        height={pillH}
        cornerRadius={pillH / 2}
        fill={isCurrentUser ? '#111' : 'rgba(0,0,0,0.55)'}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={Math.round(4 * sc)}
        shadowOffsetY={Math.round(1 * sc)}
        listening={false}
      />

      {/* Username label */}
      <Text
        x={pillX + pillPad * 1.5}
        y={pillY + pillPad}
        text={labelText}
        fontSize={fontSize}
        fontStyle={isCurrentUser ? 'bold' : 'normal'}
        fill="white"
        listening={false}
      />
    </Group>
  );
};

export default UserPawn;