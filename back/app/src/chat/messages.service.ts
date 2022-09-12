import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  ChatRoom,
  Game,
  Player,
  IBar,
  IBall,
  Score,
} from './entities/message.entity';
import { Socket } from 'socket.io';

@Injectable()
export class MessagesService {
  playerList: Player[] = [];
  playerQueue: Player[] = [];
  rooms: ChatRoom[] = [];
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

  joiningPlayerList(socket: Socket) {
    const player: Player = {
      input: [],
      left: false,
      right: false,
      name: `player-${this.playerList.length + 1}`,
      socket: socket,
      elo: 0,
      status: 'idle',
    };
    this.playerList.push(player);
  }

  joinQueue(socket: Socket) {
    //for later : need to make sure the socket is in only once
    const player = this.playerList.find((element) => element.socket === socket);
    if (this.playerQueue.length < 1) {
      this.playerQueue.push(player);
      player.status = 'inQueue';
    } else {
      const roomName = `game-${this.games.length + 1}`;
      this.games.push({
        room: {
          name: roomName,
          hostName: '',
          clientName: '',
          status: 'launching',
          options: {
            ballSpeed: { x: 2, y: 2 },
            ballsize: 16,
            barSpeed: 7,
            barSize: { x: 40, y: 10 },
            scoreMax: 5,
            timeLimit: 0,
          },
        },
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
        host: this.playerQueue.shift(),
        client: player,
      });
      const host = this.games.find(
        (element) => element.room.name === roomName,
      ).host;
      host.status = 'inLobby';
      host.socket.join(roomName);
      player.status = 'inLobby';
      player.socket.join(roomName);
      return this.games[this.games.length - 1];
    }
    return null;
  }

  storeBarMove(socket: Socket, key: string) {
    this.playerList
      .find((element) => element.socket === socket)
      .input.push(key);
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

  loop(game: Game) {
    const gameState = game.gameState;
    this.updateMoveStatus(game.host);
    this.updateMoveStatus(game.client);

    this.moveBar(gameState.hostBar, game.host);
    this.moveBar(gameState.clientBar, game.client);

    this.barBallCollision(
      gameState.hostBar,
      gameState.clientBar,
      gameState.ball,
    );
    this.wallBallCollision(gameState.ball);

    gameState.ball.pos.x += gameState.ball.speed.x;
    gameState.ball.pos.y -= gameState.ball.speed.y;

    this.goal(gameState.ball, gameState.score);
  }
}
