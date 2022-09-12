export class IPoint {
  x: number;
  y: number;
}

export class IBar {
  size: IPoint;
  pos: IPoint;
  speed: number;
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
  gameStatus: string;
  gameOptions: GameOptions;
}

export class Message {
  name: string;
  message: string;
}

export class Player {
  input: string[];
  left: boolean;
  right: boolean;
}

export class Game {
  room: GameRoom;
  gameState: GameState;
  host: Player;
  client: Player;
}
