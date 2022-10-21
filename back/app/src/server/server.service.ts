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
  IPower,
  GameState,
  GameSummary,
  PowerElastico,
} from './entities/server.entity';
import { Server, Socket } from 'socket.io';
import { UserEntity } from 'src/user/user.entity';

const chargeMax = 1;
const ballSize = 16;
const barSize: IPoint = { x: 50, y: 10 };

@Injectable()
export class ServerService {
  playerList: Player[] = [];
  playerQueue: Player[] = [];
  rooms: ChatRoom[] = [];
  games: Game[] = [];

  clientToUser = [];

  server: Server = null;

  //generic stuff
  newUser(token: string, user: UserEntity) {
    const player: Player = {
      token: token,
      input: [],
      left: false,
      right: false,
      name: user.nickname,
      socket: null,
      elo: 0,
      status: 'idle',
      smashLeft: 0,
      smashRight: 0,
      power: new IPower('init'),
    };
    this.playerList.push(player);
  }

  reloadUser(token: string, user: string, sock: Socket) {
    const player: Player = {
      token: token,
      input: [],
      left: false,
      right: false,
      name: user,
      socket: sock,
      elo: 0,
      status: 'idle',
      smashLeft: 0,
      smashRight: 0,
      power: new IPower('init'),
    };
    this.playerList.push(player);
  }

  //chat stuff
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

  //game stuff
  elo_calc(winner: Player, loser: Player) {
    const diff = Math.round((winner.elo - loser.elo) / 10);
    const elo = 10 - diff;
    winner.elo += elo;
    loser.elo -= elo;
    return elo;
  }

  inverseSummary(summary: GameSummary) {
    const inversedSummary: GameSummary = {
      hostName: summary.clientName,
      hostScore: summary.clientScore,
      hostPower: summary.clientPower,
      hostElo: summary.clientElo,
      clientElo: summary.hostElo,
      clientName: summary.hostName,
      clientPower: summary.hostPower,
      clientScore: summary.hostScore,
      eloChange: summary.eloChange,
      gameMode: summary.gameMode,
      gameTime: summary.gameTime,
      gameDate: summary.gameDate,
    };

    return inversedSummary;
  }

  end_game(game: Game) {
    game.room.status = 'gameOver';
    let elo = 0;
    if (game.gameState.score.client >= game.room.options.scoreMax) {
      elo = this.elo_calc(game.client, game.host);
      this.summarize(game, elo);
      game.host.socket.emit('Lose', game.room, elo, game.gameSummary);
      game.client.socket.emit(
        'Win',
        game.room,
        elo,
        this.inverseSummary(game.gameSummary),
      );
    } else if (game.gameState.score.host >= game.room.options.scoreMax) {
      elo = this.elo_calc(game.host, game.client);
      this.summarize(game, elo);
      game.host.socket.emit('Win', game.room, elo, game.gameSummary);
      game.client.socket.emit(
        'Lose',
        game.room,
        elo,
        this.inverseSummary(game.gameSummary),
      );
    }
    game.host.status = 'idle';
    game.client.status = 'idle';
    this.games.splice(this.games.indexOf(game), 1);
  }

  forfeit_game(winner: Player, loser: Player, game: Game) {
    const elo = this.elo_calc(winner, loser);
    this.summarize(game, elo);
    winner.socket.emit('Win', game.room, elo, game.gameSummary);
    loser.socket.emit('Lose', game.room, elo, game.gameSummary);
    game.host.status = 'idle';
    game.client.status = 'idle';
    this.games.splice(this.games.indexOf(game), 1);
    this.playerList.splice(this.playerList.indexOf(loser), 1);
  }

  reconnect(player: Player) {
    let game = this.games.find((element) => element.host.name === player.name);
    if (!game)
      game = this.games.find((element) => element.host.name === player.name);
    if (game) {
      player.socket.emit('reconnect', game.room);
      player.socket.join(game.room.name);
    }
  }

  newGame(client: Player) {
    const newGame = {
      room: {
        name: '',
        hostName: '',
        clientName: '',
        status: 'launching',
        kickOff: false,
        barCollide: false,
        sideCollide: false,
        effect: 'null',
        options: {
          scoreMax: 3,
          ballSpeed: this.getRandomStart(),
          ballsize: 16,
          barSpeed: 7,
          barSize: { x: 40, y: 10 },
        },
      },
      gameState: {
        ball: {
          size: ballSize,
          pos: { x: 250, y: 250 },
          speed: { x: 2, y: 2 },
        },
        hostBar: {
          size: barSize,
          pos: { x: 250, y: 460 },
          speed: 0,
          smashing: false,
        },
        clientBar: {
          size: barSize,
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
      client: client,
      gameSummary: {
        hostName: '',
        hostScore: 0,
        hostPower: '',
        hostElo: 0,
        clientName: '',
        clientScore: 0,
        clientPower: '',
        clientElo: 0,
        eloChange: 0,
        gameMode: '',
        gameTime: 0,
        gameDate: new Date(),
      },
    };
    this.initPower(
      newGame.client,
      newGame.gameState,
      newGame.gameState.clientBar,
    );
    this.initPower(newGame.host, newGame.gameState, newGame.gameState.hostBar);
    return newGame;
  }

  initGameValues(game: Game) {
    game.gameState.ball.speed.x *= game.room.options.ballSpeed;
    game.gameState.ball.speed.y *= game.room.options.ballSpeed;
    game.gameState.ball.size *=
      game.room.options.ballSize == 0 ? 0.5 : game.room.options.ballSize;
    game.gameState.clientBar.speed *=
      game.room.options.barSpeed == 0 ? 0.5 : game.room.options.barSpeed;
    game.gameState.clientBar.size.x *=
      game.room.options.barSize == 0 ? 0.5 : game.room.options.barSize;
    game.gameState.clientBar.size.y *=
      game.room.options.barSize == 0 ? 0.5 : game.room.options.barSize;
    game.gameState.hostBar = game.gameState.clientBar;
  }

  printList() {
    console.log('~~ player list ~~');
    this.playerList.forEach((element) => {
      console.log(element.name);
    });
    console.log('~~ player queue ~~');
    this.playerQueue.forEach((element) => {
      console.log(element.name);
    });
    console.log('~~ game list ~~');
    this.games.forEach((element) => {
      console.log(element.room.name);
      console.log(element.host.name);
      console.log(element.client.name);
    });
  }

  initPower(player: Player, gameState: GameState, bar: IBar) {
    if (player.power.name == 'elastico')
      player.power = new PowerElastico(bar, player.power.name);
  }

  handlePower(game: Game) {
    game.client.power.handle();
    game.host.power.handle();
  }

  SocketToPlayer(socket: Socket) {
    const player = this.playerList.find((element) => element.socket === socket);
    if (player) return player;
    return;
  }

  summarize(game: Game, elo: number) {
    game.gameSummary.clientName = game.client.name;
    game.gameSummary.clientElo = game.client.elo;
    game.gameSummary.clientPower = game.client.power.name;
    game.gameSummary.clientScore = game.gameState.score.client;
    game.gameSummary.hostName = game.host.name;
    game.gameSummary.hostElo = game.host.elo;
    game.gameSummary.hostPower = game.host.power.name;
    game.gameSummary.hostScore = game.gameState.score.host;
    game.gameSummary.eloChange = elo;
    game.gameSummary.gameTime =
      new Date().getTime() - game.gameSummary.gameDate.getTime();
  }

  joinQueue(socket: Socket, powerName: string) {
    const player = this.playerList.find((element) => element.socket === socket);
    if (!player) return;
    player.power = new IPower(powerName);
    if (this.playerQueue.find((element) => element === player))
      this.playerQueue.splice(this.playerQueue.indexOf(player), 1);
    if (this.playerQueue.length < 1) {
      this.playerQueue.push(player);
      player.status = 'inQueue';
    } else {
      const game = this.newGame(player);
      this.games.push(game);
      game.room.name = 'game-' + game.host.name + '-' + game.client.name;
      game.host.status = 'inLobby';
      game.host.socket.join(game.room.name);
      game.client.status = 'inLobby';
      game.client.socket.join(game.room.name);
      return game;
    }
    return null;
  }

  storeInput(socket: Socket, key: string) {
    const player = this.playerList.find((element) => element.socket === socket);
    if (player) player.input.push(key);
  }

  updateMoveStatus(
    player: Player,
    bar: IBar,
    playerType: string,
    gameState: GameState,
  ) {
    player.input.forEach((input) => {
      if (input === 'downSpace') player.power.active();
      else if (input === 'downRight')
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
          console.log('Client = ');
          console.log(
            'initial ball speed : ' + ball.speed.x + ' & ' + ball.speed.y,
          );
          console.log(
            'Smash power (L/R) : ' +
              client.smashLeft +
              ' & ' +
              client.smashRight,
          );
          client.power.handle();
          if (client.smashLeft > 0) {
            ball.speed.x = 1 * M + client.smashLeft;
            ball.speed.y = 1 * M + client.smashLeft;
          } else if (client.smashRight > 0) {
            ball.speed.x = -1 * M - client.smashRight;
            ball.speed.y = 1 * M + client.smashRight;
          } else {
            ball.speed.y *= -1;
          }
          clientBar.smashing = false;
          client.smashLeft = 0;
          client.smashRight = 0;
          room.barCollide = true;
          this.storeEffect(clientBar, room);
          console.log(
            'out ball speed : ' + ball.speed.x + ' & ' + ball.speed.y,
          );
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
          console.log('Host = ');
          // console.log(
          //   'initial ball speed : ' + ball.speed.x + ' & ' + ball.speed.y,
          // );
          // console.log(
          //   'Smash power (L/R) : ' + host.smashLeft + ' & ' + host.smashRight,
          // );
          host.power.handle();
          if (host.smashLeft > 0) {
            ball.speed.x = -1 * M - host.smashLeft;
            ball.speed.y = 1 * M + host.smashLeft;
          } else if (host.smashRight > 0) {
            ball.speed.x = 1 * M + host.smashRight;
            ball.speed.y = 1 * M + host.smashRight;
          } else {
            ball.speed.y *= -1;
          }
          hostBar.smashing = false;
          host.smashLeft = 0;
          host.smashRight = 0;
          room.barCollide = true;
          this.storeEffect(hostBar, room);
          // console.log(
          //   'out ball speed : ' + ball.speed.x + ' & ' + ball.speed.y,
          // );
        }
      }
    }
    if (!room.sideCollide) {
      if (
        ball.pos.x > clientBar.pos.x + clientBar.size.x &&
        ball.pos.x - ball.size < clientBar.pos.x + clientBar.size.x
      ) {
        if (ball.pos.y - ball.size < clientBar.pos.y) {
          if (!ball.speed.x) ball.speed.x *= -1;
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
          if (ball.speed.x) ball.speed.x *= -1;
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
          if (!ball.speed.x) ball.speed.x *= -1;
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
          if (ball.speed.x) ball.speed.x *= -1;
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
      score: { host: gameState.score.client, client: gameState.score.host },
    };
    return inverseState;
  }

  //need optional parameter speed
  getRandomStart() {
    // const random = Math.random() * 3 + 1;
    // const pos: IPoint = {
    //   x: (4 - random) * (Math.round(Math.random()) * 2 - 1),
    //   y: random * (Math.round(Math.random()) * 2 - 1),
    // };
    // return pos;
    const pos: IPoint = { x: 0, y: 1 };
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
    game.host.input = [];
    game.host.left = false;
    game.host.right = false;
    game.client.smashLeft = 0;
    game.client.smashRight = 0;
    game.client.input = [];
    game.client.left = false;
    game.client.right = false;
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
    if (game.client.smashLeft > 0 && game.client.smashLeft < chargeMax) {
      game.client.smashLeft += 0.01;
    } else if (
      game.client.smashRight > 0 &&
      game.client.smashRight < chargeMax
    ) {
      game.client.smashRight += 0.01;
    }
    if (game.host.smashLeft > 0 && game.host.smashLeft < chargeMax) {
      game.host.smashLeft += 0.01;
    } else if (game.host.smashRight > 0 && game.host.smashRight < chargeMax) {
      game.host.smashRight += 0.01;
    }
  }

  loop(game: Game) {
    if (!game.room.kickOff) {
      const gameState = game.gameState;
      this.updateMoveStatus(game.host, gameState.hostBar, 'host', gameState);
      this.updateMoveStatus(
        game.client,
        gameState.clientBar,
        'client',
        gameState,
      );
      this.chargeUp(game);
      //this.handlePower(game);
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
