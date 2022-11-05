export interface GameSummaryData {
  host: PlayerInfoData;
  client: PlayerInfoData;
  gameMode: string;
}

export interface PlayerInfoData {
  elo: number;
  name: String;
  power: String;
  score: number;
  eloChange: number;
}

export interface User {
  nickname: string;
  avatar: string;
  friends?: User[];
  history?: History[];
}

export interface History {
  host: User;
  hostScore: number;
  hostPower: string;
  hostElo: number;
  client: User;
  clientScore: number;
  clientPower: string;
  clientElo: number;
  eloChange: number;
  gameMode: string;
}
