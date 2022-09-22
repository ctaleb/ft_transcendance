import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  ChatRoom,
  Game,
  GameRoom,
  Player,
  IBar,
  IBall,
  IPoint,
  Score,
  GameState,
} from './entities/message.entity';
import { Server, Socket } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';

@Injectable()
export class MessagesService {
  playerList: Player[] = [];
  playerQueue: Player[] = [];
  rooms: ChatRoom[] = [];
  games: Game[] = [];

  clientToUser = [];

  server: Server = null;

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
      smashLeft: 0,
      smashRight: 0,
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
          kickOff: false,
          barCollide: false,
          sideCollide: false,
          effect: 'null',
          options: {
            ballSpeed: this.getRandomStart(),
            ballsize: 16,
            barSpeed: 7,
            barSize: { x: 40, y: 10 },
            scoreMax: 5,
            chargeMax: 1,
            timeLimit: 0,
          },
        },
        gameState: {
          ball: {
            size: 16,
            pos: { x: 250, y: 250 },
            speed: { x: 2, y: 2 },
          },
          hostBar: {
            size: { x: 50, y: 10 },
            pos: { x: 250, y: 460 },
            speed: 0,
            smashing: false,
          },
          clientBar: {
            size: { x: 50, y: 10 },
            pos: { x: 250, y: 40 },
            speed: 0,
            smashing: false,
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

  updateMoveStatus(player: Player, bar: IBar, playerType: string) {
    player.input.forEach((input) => {
      if (input === 'downRight')
        playerType === 'host' ? (player.right = true) : (player.left = true);
      else if (input === 'downLeft')
        playerType === 'host' ? (player.left = true) : (player.right = true);
      else if (input === 'upRight')
        playerType === 'host' ? (player.right = false) : (player.left = false);
      else if (input === 'upLeft')
        playerType === 'host' ? (player.left = false) : (player.right = false);
      else if (input === 'downA') {
        player.smashLeft = 0.01;
        player.smashRight = 0;
        bar.smashing = true;
      } else if (input === 'downD') {
        player.smashRight = 0.01;
        player.smashLeft = 0;
        bar.smashing = true;
      } else if (input === 'upA') {
        player.smashLeft = 0;
        bar.smashing = false;
      } else if (input === 'upD') {
        player.smashRight = 0;
        bar.smashing = false;
      }
    });
    player.input = [];
  }

  moveBar(bar: IBar, player: Player) {
    const speedLimit = player.smashLeft > 0 || player.smashRight > 0 ? 2 : 7;
    if ((player.left && player.right) || (!player.left && !player.right))
      bar.speed = 0;
    else if (player.left && !player.right) {
      if (bar.speed > -speedLimit) bar.speed -= 1;
    } else if (!player.left && player.right) {
      if (bar.speed < speedLimit) bar.speed += 1;
    }

    if (
      (bar.pos.x + bar.speed > 0 && bar.speed < 0) ||
      (bar.pos.x + bar.speed < 500 && bar.speed > 0)
    )
      bar.pos.x += bar.speed;
  }

  rotateVector = function (vec: IPoint, ang: number) {
    ang = -ang * (Math.PI / 180);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    vec.x = Math.round(10000 * (vec.x * cos - vec.y * sin)) / 10000;
    vec.y = Math.round(10000 * (vec.x * sin + vec.y * cos)) / 10000;
  };

  storeEffect(bar: IBar, room: GameRoom) {
    if (bar.speed > 0) room.effect = 'right';
    else if (bar.speed < 0) room.effect = 'left';
    else room.effect = 'null';
  }

  barBallCollision(
    hostBar: IBar,
    clientBar: IBar,
    ball: IBall,
    room: GameRoom,
    host: Player,
    client: Player,
  ) {
    const M =
      Math.sqrt(Math.pow(ball.speed.x, 2) + Math.pow(ball.speed.y, 2)) /
      Math.sqrt(2);
    if (!room.barCollide) {
      if (
        ball.pos.y - ball.size <= clientBar.pos.y + clientBar.size.y &&
        ball.pos.y > clientBar.pos.y + clientBar.size.y
      ) {
        if (
          ball.pos.x < clientBar.pos.x + clientBar.size.x + ball.size &&
          ball.pos.x > clientBar.pos.x - clientBar.size.x - ball.size
        ) {
          ball.speed.y *= -1;
          ball.speed.y *= client.smashRight + client.smashLeft + 1;
          if (client.smashLeft > 0) {
            ball.speed.x = 1 * M + client.smashLeft;
          } else if (client.smashRight > 0) {
            ball.speed.x = -1 * M - client.smashRight;
          }
          ball.speed.y = 1 * M + client.smashRight + client.smashLeft;
          client.smashLeft = 0;
          client.smashRight = 0;
          clientBar.smashing = false;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.barCollide = true;
          this.storeEffect(clientBar, room);
        }
      }
      if (
        ball.pos.y + ball.size >= hostBar.pos.y - hostBar.size.y &&
        ball.pos.y < hostBar.pos.y - hostBar.size.y
      ) {
        if (
          ball.pos.x < hostBar.pos.x + hostBar.size.x + ball.size &&
          ball.pos.x > hostBar.pos.x - hostBar.size.x - ball.size
        ) {
          ball.speed.y *= -1;
          ball.speed.y *= client.smashRight + client.smashLeft + 1;
          if (host.smashLeft > 0) {
            ball.speed.x = -1 * M - host.smashLeft;
          } else if (host.smashRight > 0) {
            ball.speed.x = 1 * M + host.smashRight;
          }
          ball.speed.y = -1 * M - host.smashLeft - host.smashRight;
          host.smashLeft = 0;
          host.smashRight = 0;
          hostBar.smashing = false;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.barCollide = true;
          this.storeEffect(hostBar, room);
        }
      }
    }
    if (!room.sideCollide) {
      if (
        ball.pos.x > clientBar.pos.x + clientBar.size.x &&
        ball.pos.x - ball.size < clientBar.pos.x + clientBar.size.x
      ) {
        if (ball.pos.y - ball.size < clientBar.pos.y) {
          ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
          this.storeEffect(clientBar, room);
        }
      } else if (
        ball.pos.x < clientBar.pos.x - clientBar.size.x &&
        ball.pos.x + ball.size > clientBar.pos.x - clientBar.size.x
      ) {
        if (ball.pos.y - ball.size < clientBar.pos.y) {
          ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
          this.storeEffect(clientBar, room);
        }
      }
      if (
        ball.pos.x > hostBar.pos.x + hostBar.size.x &&
        ball.pos.x - ball.size < hostBar.pos.x + hostBar.size.x
      ) {
        if (ball.pos.y + ball.size > hostBar.pos.y) {
          ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
          this.storeEffect(hostBar, room);
        }
      } else if (
        ball.pos.x < hostBar.pos.x - hostBar.size.x &&
        ball.pos.x + ball.size > hostBar.pos.x - hostBar.size.x
      ) {
        if (ball.pos.y + ball.size > hostBar.pos.y) {
          ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
          this.storeEffect(hostBar, room);
        }
      }
    }
  }

  applyEffect(room: GameRoom) {
    if (room.effect === 'left') room.effect = 'doLeft';
    else if (room.effect === 'right') room.effect = 'doRight';
  }

  wallBallCollision(ball: IBall, room: GameRoom) {
    if (ball.pos.x - 16 <= 0) {
      ball.speed.x *= -1;
      ball.pos.x = 0 + 16;
      this.applyEffect(room);
    }
    if (ball.pos.x + 16 > 500) {
      ball.speed.x *= -1;
      ball.pos.x = 500 - 16;
      this.applyEffect(room);
    }
  }

  goal(game: Game) {
    if (game.gameState.ball.pos.y < 0 || game.gameState.ball.pos.y > 500) {
      if (game.gameState.ball.pos.y < 0) {
        game.gameState.score.host += 1;
      } else {
        game.gameState.score.client += 1;
      }
      this.resetGameState(game);
      this.startRound(game.room);
    }
  }

  inverseState(gameState: GameState) {
    const inverseState: GameState = {
      ball: {
        size: gameState.ball.size,
        pos: { x: 500 - gameState.ball.pos.x, y: 500 - gameState.ball.pos.y },
        speed: gameState.ball.speed,
      },
      hostBar: {
        size: gameState.hostBar.size,
        pos: {
          x: 500 - gameState.hostBar.pos.x,
          y: 500 - gameState.hostBar.pos.y,
        },
        speed: gameState.hostBar.speed,
        smashing: gameState.hostBar.smashing,
      },
      clientBar: {
        size: gameState.clientBar.size,
        pos: {
          x: 500 - gameState.clientBar.pos.x,
          y: 500 - gameState.clientBar.pos.y,
        },
        speed: gameState.clientBar.speed,
        smashing: gameState.clientBar.smashing,
      },
      score: gameState.score,
    };
    return inverseState;
  }

  getRandomStart() {
    const random = Math.random() * 3 + 1;
    const pos: IPoint = {
      x: (4 - random) * (Math.round(Math.random()) * 2 - 1),
      y: random * (Math.round(Math.random()) * 2 - 1),
    };
    return pos;
  }

  resetGameState(game: Game) {
    game.gameState.ball.pos = { x: 250, y: 250 };
    game.gameState.ball.speed = this.getRandomStart();
    game.gameState.hostBar.pos = { x: 250, y: 460 };
    game.gameState.hostBar.speed = 0;
    game.gameState.hostBar.smashing = false;
    game.gameState.clientBar.pos = { x: 250, y: 40 };
    game.gameState.clientBar.speed = 0;
    game.gameState.clientBar.smashing = false;
    game.room.barCollide = false;
    game.room.sideCollide = false;
    game.room.effect = 'null';
    game.host.smashLeft = 0;
    game.host.smashRight = 0;
    game.client.smashLeft = 0;
    game.client.smashRight = 0;
  }

  startRound(room: GameRoom) {
    room.kickOff = true;
    this.server.to(room.name).emit('kickOff');
    setTimeout(() => {
      room.kickOff = false;
      this.server.to(room.name).emit('play');
    }, 3000);
  }

  reset_collide(ball: IBall, room: GameRoom) {
    if (room.barCollide && ball.speed.y > 0 && ball.pos.y > 250) {
      room.barCollide = false;
      room.sideCollide = false;
    } else if (room.barCollide && ball.speed.y < 0 && ball.pos.y < 250) {
      room.barCollide = false;
      room.sideCollide = false;
    }
  }

  nadal(ball: IBall, effect: string) {
    if (effect === 'doLeft') this.rotateVector(ball.speed, 0.3);
    else if (effect === 'doRight') this.rotateVector(ball.speed, -0.3);
  }

  chargeUp(game: Game) {
    if (
      game.client.smashLeft > 0 &&
      game.client.smashLeft < game.room.options.chargeMax
    ) {
      game.client.smashLeft += 0.01;
    } else if (
      game.client.smashRight > 0 &&
      game.client.smashRight < game.room.options.chargeMax
    ) {
      game.client.smashRight += 0.01;
    }
    if (
      game.host.smashLeft > 0 &&
      game.client.smashLeft < game.room.options.chargeMax
    ) {
      game.host.smashLeft += 0.01;
    } else if (
      game.host.smashRight > 0 &&
      game.client.smashRight < game.room.options.chargeMax
    ) {
      game.host.smashRight += 0.01;
    }
  }

  loop(game: Game) {
    if (!game.room.kickOff) {
      const gameState = game.gameState;
      this.updateMoveStatus(game.host, gameState.hostBar, 'host');
      this.updateMoveStatus(game.client, gameState.clientBar, 'client');

      this.chargeUp(game);

      this.moveBar(gameState.hostBar, game.host);
      this.moveBar(gameState.clientBar, game.client);

      this.barBallCollision(
        gameState.hostBar,
        gameState.clientBar,
        gameState.ball,
        game.room,
        game.host,
        game.client,
      );
      this.wallBallCollision(gameState.ball, game.room);

      this.nadal(gameState.ball, game.room.effect);
      this.reset_collide(gameState.ball, game.room);
      gameState.ball.pos.x += gameState.ball.speed.x;
      gameState.ball.pos.y += gameState.ball.speed.y;

      this.goal(game);
    }
  }
}