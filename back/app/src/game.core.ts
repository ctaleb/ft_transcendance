import { Socket } from 'socket.io';

export class GameState {
  public room: string;
  public gameOn: boolean = false;
  public ready: boolean = false;
}
