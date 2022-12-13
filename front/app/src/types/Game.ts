import { User } from "@/types/User";

export interface IPoint {
  x: number;
  y: number;
}

export interface particle {
  start: IPoint;
  end: IPoint;
  color: string;
  trail: IPoint[];
}

export interface particleSet {
  particles: particle[];
  reach: boolean;
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

export interface IHit {
  x: number;
  y: number;
  hit: number;
}

export interface GameState {
  frame: number;
  ball: IBall;
  hostPower: IPowerInfo;
  clientPower: IPowerInfo;
  hostBar: IBar;
  clientBar: IBar;
  score: Score;
  hit: IHit;
  state: string;
}

export interface GameOptions {
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

export interface ChatRoom {
  name: string;
  messages: Message[];
  userList: string[];
}

export interface GameRoom {
  name: string;
  hostName: string;
  clientName: string;
  opponent: User;
  host: User;
  status: string;
  kickOff: boolean;
  barCollide: boolean;
  sideCollide: boolean;
  effect: string;
  start: string;
  end: string;
  options: GameOptions;
}

export interface Message {
  name: string;
  message: string;
}

export interface Status {
  id: number;
  status: string;
}

export interface GameData {
  input: string[];
  smashLeft: number;
  smashRight: number;
  left: boolean;
  right: boolean;
  elo: number;
  status: string;
  power: IPower;
}

export interface ChatData {
  RoomList: string[];
}

export interface IPowerInfo {
  maxCharge: number;
  currentCharge: number;
  isActive: boolean;
}

export interface IPower {
  name: string;
  maxCharge: number;
  currentCharge: number;
  isActive: boolean;
  trigger: boolean;
}
