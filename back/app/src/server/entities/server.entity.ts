import { Socket } from 'socket.io';

export class IPoint {
  x: number;
  y: number;
}

export class IBar {
  size: IPoint;
  pos: IPoint;
  speed: number;
  smashing: boolean;
}

export class IBall {
  size: number;
  pos: IPoint;
  speed: IPoint;
}

export class Score {
  client: number;
  host: number;
}

export class GameState {
  ball: IBall;
  hostBar: IBar;
  clientBar: IBar;
  score: Score;
}

export class GameOptions {
  scoreMax: number;
  ballSpeed: number;
  ballSize: number;
  barSpeed: number;
  barSize: number;
  smashStrength: number;
  effects: boolean;
  powers: boolean;
  smashes: boolean;
}

export class ChatRoom {
  name: string;
  messages: Message[];
  userList: string[];
}

export class GameRoom {
  name: string;
  hostName: string;
  clientName: string;
  status: string;
  kickOff: boolean;
  barCollide: boolean;
  sideCollide: boolean;
  effect: string;
  options: GameOptions;
}

export class Message {
  name: string;
  message: string;
}

export class Player {
  token: string;
  input: string[];
  smashLeft: number;
  smashRight: number;
  left: boolean;
  right: boolean;
  name: string;
  socket: Socket;
  elo: number;
  status: string;
  power: IPower;
}

export class Game {
  room: GameRoom;
  gameState: GameState;
  host: Player;
  client: Player;
  gameSummary: GameSummary;
}

export class GameSummary {
  hostName: string;
  hostScore: number;
  hostPower: string;
  hostElo: number;
  clientName: string;
  clientScore: number;
  clientPower: string;
  clientElo: number;
  eloChange: number;
  gameMode: string;
  gameTime: number;
  gameDate: Date;
}

export class IPower {
  name: string;
  maxCharge: number;
  currentCharge: number;
  isActive: boolean;
  timeLeft: number;

  constructor(name: string) {
    this.name = name;
    this.currentCharge = 0;
    this.isActive = false;
  }

  active() {
    this.isActive = true;
    this.currentCharge = 0;
  }
  handle() {}

  chargeUp() {}
}

export class PowerElastico extends IPower {
  initialBarSize: number;
  bar: IBar;

  constructor(bar: IBar, name: string) {
    super(name);
    this.maxCharge = 8;
    this.timeLeft = 0;
    this.initialBarSize = bar.size.x;
    this.bar = bar;
  }

  active() {
    console.log('-- in active() --');
    console.log('current charge: ' + this.currentCharge);
    console.log('isActive: ' + this.isActive);
    console.log('timeLeft: ' + this.timeLeft);
    if (this.isActive === false && this.currentCharge >= 2) {
      this.isActive = true;
      this.currentCharge = 0;
      this.timeLeft = 3;
      this.bar.size.x *= 1.5;
    }
  }
  handle() {
    console.log('-- in handle() --');
    console.log('current charge: ' + this.currentCharge);
    console.log('isActive: ' + this.isActive);
    console.log('timeLeft: ' + this.timeLeft);
    if (this.isActive) {
      this.timeLeft--;
      if (this.timeLeft == 0) {
        this.isActive = false;
        this.bar.size.x = this.initialBarSize;
      }
    } else {
      this.currentCharge++;
    }
  }
}
