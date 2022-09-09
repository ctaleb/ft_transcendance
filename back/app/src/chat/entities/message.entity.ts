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

export class Player {
  name: string;
  input: string[];
  left: boolean;
  right: boolean;
}

export class Game {
  id: string;
  gameState: GameState;
  specList: string[];
  host: Player;
  client: Player;
}
