class Pawn {
  constructor(username, position = { x: 0, y: 0 }, color = null) {
    this.username = username;
    this.position = position;
    this.color = color || this.generateColor();
    this.lastMoved = new Date();
    this.isActive = true;
  }

  generateColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updatePosition(x, y) {
    this.position = { x, y };
    this.lastMoved = new Date();
  }

  setPosition(position) {
    this.position = position;
    this.lastMoved = new Date();
  }

  setColor(color) {
    this.color = color;
  }

  deactivate() {
    this.isActive = false;
  }

  getDistance(otherPawn) {
    const dx = this.position.x - otherPawn.position.x;
    const dy = this.position.y - otherPawn.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  toJSON() {
    return {
      username: this.username,
      position: this.position,
      color: this.color,
      lastMoved: this.lastMoved,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    const pawn = new Pawn(data.username, data.position, data.color);
    pawn.lastMoved = new Date(data.lastMoved);
    pawn.isActive = data.isActive;
    return pawn;
  }
}

module.exports = Pawn;
