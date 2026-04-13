class MessageService {
  validate(socket, room) {
    if (!socket.room || socket.room !== room) {
      throw new Error('You are not in this room.');
    }
  }

  build({ message, username, timestamp, room }) {
    return { message, username, timestamp, room };
  }
}

module.exports = new MessageService();