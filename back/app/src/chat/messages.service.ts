import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, Room, Game } from './entities/message.entity';
import { GameState, IPoint } from '../game-state/entities/game-state.entity';
import { PassThrough } from 'stream';

// interface Room {
//   name: string;
//   message: Message[];
// }

@Injectable()
export class MessagesService {
  rooms: Room[] = [];
  games: Game[] = [];

  clientToUser = [];

  identify(name: string, clientId: string, room: string) {
    this.clientToUser[clientId] = name;
    if (this.rooms.find((element) => element.name === room) === undefined)
      this.rooms.push({ name: room, messages: [], userList: [] });
    this.rooms.find((element) => element.name === room).userList.push(name);
    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string, room: string) {
    return this.clientToUser[clientId];
  }

  create(createMessageDto: CreateMessageDto, clientId: string, room: string) {
    const message = {
      name: this.clientToUser[clientId],
      message: createMessageDto.message,
    };
    this.rooms.find((element) => element.name === room).messages.push(message);

    return message;
  }

  findAll(room: string) {
    return this.rooms.find((element) => element.name === room).messages;
  }

  findUsers(room: string) {
    // console.log(this.rooms.find((element) => element.name === room).userList);
    return this.rooms.find((element) => element.name === room).userList;
  }

  //game stuff here

  joiningGame(room: string) {
    if (!this.findGame(room)) {
      this.games.push({
        id: room,
        gameState: {
          ball: { x: 200, y: 200 },
          speed: { x: 5, y: 5 },
          hostBar: { x: 200, y: 50 },
          clientBar: { x: 450, y: 450 },
        },
        playerList: [],
        specList: [],
        hostInput: '',
        clientInput: '',
      });
      //   this.loop(room);
      return false;
    }
    return true;
  }

  findGame(room: string) {
    if (this.games.find((element) => element.id === room) === undefined)
      return false;
    return true;
  }

  updateGameState(room: string) {
    return this.games.find((element) => element.id === room);
  }

  loop(room: string) {
    const thisGame = this.games.find((element) => element.id === room);
    if (thisGame.gameState.ball.x - 16 <= 0) {
      thisGame.gameState.speed.x *= -1;
      thisGame.gameState.ball.x = 0 + 16;
    }
    if (thisGame.gameState.ball.x + 16 > 500) {
      thisGame.gameState.speed.x *= -1;
      thisGame.gameState.ball.x = 500 - 16;
    }
    if (thisGame.gameState.speed.y > 0) {
      if (
        thisGame.gameState.ball.y > 500 - 15 - 16 ||
        thisGame.gameState.ball.y <= 16 + 15
      ) {
        // thisGame.gameState.speed.y *= 1.1;
        thisGame.gameState.speed.y *= -1;
      }
    } else if (thisGame.gameState.speed.y < 0) {
      if (
        thisGame.gameState.ball.y > 500 - 15 - 16 ||
        thisGame.gameState.ball.y <= 16 + 15
      ) {
        // thisGame.gameState.speed.y *= 1.1;
        thisGame.gameState.speed.y *= -1;
      }
    }
    thisGame.gameState.ball.x += thisGame.gameState.speed.x;
    thisGame.gameState.ball.y -= thisGame.gameState.speed.y;
  }
}
