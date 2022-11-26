import { Socket } from 'socket.io';
import { MatchHistoryEntity } from './match_history.entity';

export interface IPoint {
  x: number;
  y: number;
}

export interface IBar {
  size: IPoint;
  pos: IPoint;
  speed: number;
  smashing: boolean;
  maxSpeed: number;
}

export interface IBall {
  size: number;
  pos: IPoint;
  speed: IPoint;
}

export interface Score {
  client: number;
  host: number;
}

export interface GameState {
  ball: IBall;
  hostPower: IPowerInfo;
  clientPower: IPowerInfo;
  hostBar: IBar;
  clientBar: IBar;
  score: Score;
  hit: IPoint;
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

export class Theatre {
  name: string;
  viewers: Socket[];
}

export interface Status {
  id: number;
  status: string;
}

export class Game {
  room: GameRoom;
  theatre: Theatre;
  gameState: GameState;
  host: User;
  client: User;
  gameSummary: MatchHistoryEntity;
}

export class GameData {
  input: string[];
  smashLeft: number;
  smashRight: number;
  left: boolean;
  right: boolean;
  elo: number;
  status: string;
  power: IPower;
}

export class ChatData {
  RoomList: string[];
}

export class User {
  token: string;
  socket: Socket;
  name: string;
  id: number;
  status: string;
  gameData: GameData;
  chatData: ChatData;
}

export class IPowerInfo {
  maxCharge: number;
  currentCharge: number;
  isActive: boolean;
}

export class IPower {
  name: string;
  maxCharge: number;
  currentCharge: number;
  isActive: boolean;
  trigger: boolean;

  constructor(name: string) {
    this.name = name;
    this.currentCharge = 0;
    this.isActive = false;
    this.trigger = false;
  }

  active() {
    // Empty
  }
  handle() {
    // Empty
  }
  reset() {
    // Empty
  }
  chargeUp() {
    if (this.currentCharge < this.maxCharge) this.currentCharge++;
  }
}

export class PowerElastico extends IPower {
  timeLeft: number;
  initialBarSize: number;
  bar: IBar;

  constructor(bar: IBar, name: string) {
    super(name);
    this.maxCharge = 7;
    this.timeLeft = 0;
    this.initialBarSize = bar.size.x;
    this.bar = bar;
  }

  active() {
    if (this.currentCharge == this.maxCharge) {
      this.isActive = true;
      this.currentCharge = 0;
      this.timeLeft = 3;
      this.bar.size.x *= 1.5;
    }
  }
  handle() {
    if (this.timeLeft) this.timeLeft--;
    else {
      this.reset();
    }
  }
  reset() {
    this.isActive = false;
    this.timeLeft = 0;
    this.bar.size.x = this.initialBarSize;
  }
}

export class PowerMinimo extends IPower {
  timeLeft: number;
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
    if (this.currentCharge == this.maxCharge) {
      this.isActive = true;
      this.currentCharge = 0;
      this.timeLeft = 3;
      this.bar.size.x *= 0.6;
    }
  }
  handle() {
    if (this.timeLeft) this.timeLeft--;
    else {
      this.reset();
    }
  }
  reset() {
    this.isActive = false;
    this.timeLeft = 0;
    this.bar.size.x = this.initialBarSize;
  }
}

export class PowerExhaust extends IPower {
  timeLeft: number;
  initialBarSpeed: number;
  bar: IBar;

  constructor(bar: IBar, name: string) {
    super(name);
    this.maxCharge = 10;
    this.timeLeft = 0;
    this.initialBarSpeed = JSON.parse(JSON.stringify(bar.maxSpeed));
    this.bar = bar;
  }

  active() {
    if (this.currentCharge == this.maxCharge) {
      this.isActive = true;
      this.currentCharge = 0;
      this.timeLeft = 3;
      this.bar.maxSpeed *= 0.4;
    }
  }
  handle() {
    if (this.timeLeft) this.timeLeft--;
    else {
      this.reset();
    }
  }
  reset() {
    this.isActive = false;
    this.timeLeft = 0;
    this.bar.maxSpeed = this.initialBarSpeed;
  }
}

export class PowerInvisibility extends IPower {
  constructor(name: string) {
    super(name);
    this.maxCharge = 1;
  }

  active() {
    if (this.currentCharge == this.maxCharge) {
      this.isActive = true;
      this.currentCharge = 0;
      console.log('TRIGGER');
    }
  }
  handle() {
    this.isActive = false;
    this.trigger = true;
    console.log('ACTIF');
  }
  reset() {
    this.trigger = false;
    this.isActive = false;
  }
}
