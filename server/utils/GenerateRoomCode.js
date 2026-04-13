const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRoomCode(length = 6) {
  return Array.from({ length }, () =>
    CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  ).join('');
}

module.exports = { generateRoomCode };