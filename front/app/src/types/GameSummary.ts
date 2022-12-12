import { User } from "@/types/User";

export interface GameSummaryData {
  host: PlayerInfoData;
  client: PlayerInfoData;
  gameMode: string;
  winnerID: number;
}

export interface PlayerInfoData {
  elo: number;
  name: String;
  power: String;
  score: number;
  eloChange: number;
}

export interface Alert {
  type: number;
  message: string;
  time: number;
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
  winnerID: number;
}
