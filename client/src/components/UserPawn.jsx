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
  const size = BASE * imageScale;
  const r = size / 2;
  const cx = r;
  const cy = r;
  const sc = imageScale;
  const [profileImageObj, setProfileImageObj] = useState(null);

  const COLORS = [
    '#6A1CF6', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
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

      {/* White halo ring — makes the pawn pop on any background */}
      <Circle
        x={cx}
        y={cy}
        radius={r - Math.round(1 * sc)}
        fill="white"
        stroke="white"
        strokeWidth={Math.round(3 * sc)}
      />

      {/* Main circle - either profile image or colored circle */}
      {profileImageObj ? (
        <>
          {/* White background circle for profile image */}
          <Circle
            x={cx}
            y={cy}
            radius={r - Math.round(4 * sc)}
            fill="white"
            stroke={isCurrentUser ? '#111' : 'rgba(0,0,0,0.35)'}
            strokeWidth={isCurrentUser ? Math.round(3 * sc) : Math.round(1.5 * sc)}
          />
          {/* Profile image clipped to circle */}
          <KonvaImage
            x={cx - (r - Math.round(8 * sc))}
            y={cy - (r - Math.round(8 * sc))}
            width={(r - Math.round(8 * sc)) * 2}
            height={(r - Math.round(8 * sc)) * 2}
            image={profileImageObj}
            clipFunc={(ctx) => {
              ctx.arc(cx, cy, r - Math.round(8 * sc), 0, Math.PI * 2, false);
              ctx.clip();
            }}
          />
        </>
      ) : (
        <>
          {/* Main coloured circle - fallback when no profile image */}
          <Circle
            x={cx}
            y={cy}
            radius={r - Math.round(4 * sc)}
            fill={color}
            stroke={isCurrentUser ? '#111' : 'rgba(0,0,0,0.35)'}
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