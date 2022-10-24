import { Socket } from 'socket.io';
import { MatchHistoryEntity } from './match_history.entity';

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
  ballSpeed: IPoint;
  ballsize: number;
  barSpeed: number;
  barSize: IPoint;
  scoreMax: number;
  chargeMax: number;
  timeLimit: number;
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
  power: string;
}

export class Game {
  room: GameRoom;
  gameState: GameState;
  host: Player;
  client: Player;
  gameSummary: MatchHistoryEntity;
}
