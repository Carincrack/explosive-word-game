export class Player {
  id: string;
  name: string;
  score: number = 0;
  lives: number;
  isHost: boolean = false;

  constructor(id: string, name: string, isHost: boolean = false, lives: number = 3) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
    this.lives = lives;
  }

  addScore(points: number): void {
    this.score += points;
  }

  removeLife(): void {
    this.lives -= 1;
  }

  isAlive(): boolean {
    return this.lives > 0;
  }
}