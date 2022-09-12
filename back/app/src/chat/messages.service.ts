import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, Room, Game, Player } from './entities/message.entity';
import { IBar, IBall, Score } from '../game-state/entities/game-state.entity';
import { PassThrough } from 'stream';
import { Socket } from 'socket.io';

@Injectable()
export class MessagesService {
  gameQueue: Socket[] = [];
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

  joinQueue(socket: Socket) {
    this.gameQueue.push(socket);
    if (this.gameQueue.length > 1) {
      const room = `game-${this.games.length + 1}`;
      this.games.push({
        room: room,
        gameOn: false,
        ready: false,
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
          score: {
            client: 0,
            host: 0,
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
      return this.games[this.games.length - 1];
    }
    return null;
  }

  storeBarMove(room: string, clientStatus: string, motion: string) {
    if (clientStatus === 'host')
      this.games
        .find((element) => element.room === room)
        .host.input.push(motion);
    else
      this.games
        .find((element) => element.room === room)
        .client.input.push(motion);
  }

  findGame(room: string) {
    if (this.games.find((element) => element.room === room) === undefined)
      return false;
    return true;
  }

  updateGameState(room: string) {
    return this.games.find((element) => element.room === room).gameState;
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
  wallBallCollision(ball: IBall) {
    if (ball.pos.x - 16 <= 0) {
      ball.speed.x *= -1;
      ball.pos.x = 0 + 16;
    }
    if (ball.pos.x + 16 > 500) {
      ball.speed.x *= -1;
      ball.pos.x = 500 - 16;
    }
  }

  goal(ball: IBall, score: Score) {
    if (ball.pos.y < 0) {
      score.host += 1;
      ball.pos = { x: 250, y: 250 };
    }
    if (ball.pos.y > 500) {
      score.client += 1;
      ball.pos = { x: 250, y: 250 };
    }
  }

  loop(roomName: string) {
    const room = this.games.find((element) => element.room === roomName);
    const game = room.gameState;
    this.updateMoveStatus(room.host);
    this.updateMoveStatus(room.client);

    this.moveBar(game.hostBar, room.host);
    this.moveBar(game.clientBar, room.client);

    this.barBallCollision(game.hostBar, game.clientBar, game.ball);
    this.wallBallCollision(game.ball);

    game.ball.pos.x += game.ball.speed.x;
    game.ball.pos.y -= game.ball.speed.y;

    this.goal(game.ball, game.score);
  }
}
