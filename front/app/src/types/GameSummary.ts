export interface GameSummaryData {
  host: PlayerInfoData;
  client: PlayerInfoData;
  gamemode: String;
  start: Date;
  end: Date;
}

export interface PlayerInfoData {
  elo: number;
  name: String;
  power: String;
  score: number;
  eloChange: number;
}
