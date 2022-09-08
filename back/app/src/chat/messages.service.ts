import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, Room, Game, Player } from './entities/message.entity';
import {
  GameState,
  IPoint,
  IBar,
  IBall,
} from '../game-state/entities/game-state.entity';
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
          ball: {
            size: 16,
            pos: { x: 200, y: 200 },
            speed: { x: 3, y: 3 },
          },
          hostBar: {
            size: { x: 40, y: 10 },
            pos: { x: 250, y: 460 },
            speed: 0,
          },
          clientBar: {
            size: { x: 40, y: 10 },
            pos: { x: 250, y: 40 },
            speed: 0,
          },
        },
        specList: [],
        host: {
          name: '',
          input: [],
          left: false,
          right: false,
        },
        client: {
          name: '',
          input: [],
          left: false,
          right: false,
        },
      });
      //   this.loop(room);
      return false;
    }
    return true;
  }

  storeBarMove(room: string, clientStatus: string, motion: string) {
    if (clientStatus === 'host')
      this.games.find((element) => element.id === room).host.input.push(motion);
    else
      this.games
        .find((element) => element.id === room)
        .client.input.push(motion);
  }

  findGame(room: string) {
    if (this.games.find((element) => element.id === room) === undefined)
      return false;
    return true;
  }

  updateGameState(room: string) {
    return this.games.find((element) => element.id === room).gameState;
  }

  updateMoveStatus(player: Player) {
    player.input.forEach((input) => {
      if (input === 'downRight') player.right = true;
      else if (input === 'downLeft') player.left = true;
      else if (input === 'upRight') player.right = false;
      else if (input === 'upLeft') player.left = false;
    });
    player.input = [];
  }

  moveBar(bar: IBar, player: Player) {
    if ((player.left && player.right) || (!player.left && !player.right))
      bar.speed = 0;
    else if (player.left && !player.right) {
      if (bar.speed > -7) bar.speed -= 1;
    } else if (!player.left && player.right) {
      if (bar.speed < 7) bar.speed += 1;
    }

    if (
      (bar.pos.x + bar.speed > 0 && bar.speed < 0) ||
      (bar.pos.x + bar.speed < 500 && bar.speed > 0)
    )
      bar.pos.x += bar.speed;
  }

  barBallCollision(hostBar: IBar, clientBar: IBar, ball: IBall) {
    if (ball.pos.y - ball.size <= clientBar.pos.y + clientBar.size.y) {
      if (
        ball.pos.x < clientBar.pos.x + clientBar.size.x + ball.size &&
        ball.pos.x > clientBar.pos.x - clientBar.size.x - ball.size
      ) {
        ball.speed.y *= -1;
        ball.pos.y -= ball.speed.y;
        ball.pos.x += ball.speed.x;
      }
    }
    if (ball.pos.y + ball.size >= hostBar.pos.y) {
      if (
        ball.pos.x < hostBar.pos.x + hostBar.size.x + ball.size &&
        ball.pos.x > hostBar.pos.x - hostBar.size.x - ball.size
      ) {
        ball.speed.y *= -1;
        ball.pos.y -= ball.speed.y;
        ball.pos.x += ball.speed.x;
      }
    }
  }

  loop(room: string) {
    const thisGame = this.games.find((element) => element.id === room);
    this.updateMoveStatus(thisGame.host);
    this.updateMoveStatus(thisGame.client);

    this.moveBar(thisGame.gameState.hostBar, thisGame.host);
    this.moveBar(thisGame.gameState.clientBar, thisGame.client);

    this.barBallCollision(
      thisGame.gameState.hostBar,
      thisGame.gameState.clientBar,
      thisGame.gameState.ball,
    );

    if (thisGame.gameState.ball.pos.x - 16 <= 0) {
      thisGame.gameState.ball.speed.x *= -1;
      thisGame.gameState.ball.pos.x = 0 + 16;
    }
    if (thisGame.gameState.ball.pos.x + 16 > 500) {
      thisGame.gameState.ball.speed.x *= -1;
      thisGame.gameState.ball.pos.x = 500 - 16;
    }
    if (thisGame.gameState.ball.speed.y > 0) {
      if (
        thisGame.gameState.ball.pos.y > 500 - 16 ||
        thisGame.gameState.ball.pos.y <= 16 + 15
      ) {
        thisGame.gameState.ball.speed.y *= -1;
      }
    } else if (thisGame.gameState.ball.speed.y < 0) {
      if (
        thisGame.gameState.ball.pos.y > 500 - 16 ||
        thisGame.gameState.ball.pos.y <= 16 + 15
      ) {
        thisGame.gameState.ball.speed.y *= -1;
      }
    }
    thisGame.gameState.ball.pos.x += thisGame.gameState.ball.speed.x;
    thisGame.gameState.ball.pos.y -= thisGame.gameState.ball.speed.y;
  }
}
