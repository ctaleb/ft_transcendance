import { GameState } from 'src/game-state/entities/game-state.entity';

export class Room {
  name: string;
  messages: Message[];
  userList: string[];
}

export class Message {
  name: string;
  message: string;
}

export class Game {
  id: string;
  gameState: GameState;
  playerList: string[];
  specList: string[];
  hostInput: string;
  clientInput: string;
}
