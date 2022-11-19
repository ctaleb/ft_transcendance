import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  ChatRoom,
  Game,
  GameRoom,
  User,
  IBar,
  IBall,
  IPoint,
  IPower,
  GameState,
  PowerElastico,
  PowerExhaust,
  GameOptions,
  IPowerInfo,
  PowerInvisibility,
  PowerMinimo,
} from './entities/server.entity';
import { Server, Socket } from 'socket.io';
import { UserEntity } from 'src/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MatchHistoryEntity,
  GameSummaryData,
  PlayerInfoData,
} from './entities/match_history.entity';
import { DeepPartial, Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { Channel } from './entities/channel';
import { ChatService } from 'src/chat/chat.service';

const chargeMax = 1;
const ballSize = 16;
const barSize: IPoint = { x: 50, y: 10 };
const defaultGameOptions: GameOptions = {
  scoreMax: 10,
  ballSpeed: 1,
  ballSize: 1,
  barSpeed: 1,
  barSize: 1,
  smashStrength: 1,
  effects: true,
  powers: true,
  smashes: true,
};

@Injectable()
export class ServerService {
  userList: User[] = [];
  playerQueue: User[] = [];
  rooms: ChatRoom[] = [];
  games: Game[] = [];
  channels: Channel[] = [];

  clientToUser = [];

  server: Server = null;

  constructor(
    @InjectRepository(MatchHistoryEntity)
    private _matchHistoryRepository: Repository<MatchHistoryEntity>,
    @Inject(forwardRef(() => UserService))
    private _userService: UserService,
    private _chatService: ChatService,
  ) {}

  //generic stuff
  newUser(token: string, user: string, sock?: Socket) {
    const newUser: User = {
      token: token,
      socket: null,
      name: user,
      status: 'idle',
      gameData: {
        input: [],
        left: false,
        right: false,
        elo: 0,
        smashLeft: 0,
        smashRight: 0,
        status: 'idle',
        power: new IPower('init'),
      },
      chatData: {
        RoomList: [],
      },
    };
    if (sock) newUser.socket = sock;
    this.userList.push(newUser);
  }

  // async joinAllChannels(socket: Socket, userId: number) {
  //   const channels = await this._chatService.getUserChannels(userId);
  //   channels.forEach((ell) => {
  //     socket.join(ell.id);
  //   });
  // }

  //   reloadUser(token: string, user: string, sock: Socket) {
  //     const player: Player = {
  //       token: token,
  //       input: [],
  //       left: false,
  //       right: false,
  //       name: user,
  //       socket: sock,
  //       elo: 0,
  //       status: 'idle',
  //       smashLeft: 0,
  //       smashRight: 0,
  //       power: '',
  //     };
  //     this.userList.push(player);
  //   }

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
  elo_calc(winner: User, loser: User) {
    const diff = Math.round((winner.gameData.elo - loser.gameData.elo) / 10);
    const elo = 10 - diff;
    winner.gameData.elo += elo;
    loser.gameData.elo -= elo;
    return elo;
  }

  inverseSummary(summary: GameSummaryData) {
    //   const inversedSummary: GameSummaryData = JSON.parse(
    //     JSON.stringify(summary),
    //   );
    //   // const player: PlayerInfoData = inversedSummary.host;
    //   inversedSummary.host = inversedSummary.client;
    //   inversedSummary.client = player;
    //   inversedSummary.gameMode = summary.gameMode;
    //   inversedSummary.eloChange = summary.eloChange;
    const inversedSummary: GameSummaryData = {
      client: {
        name: summary.host.name,
        elo: summary.host.elo,
        power: summary.host.power,
        score: summary.host.score,
        eloChange: summary.host.eloChange,
      },
      host: {
        name: summary.client.name,
        elo: summary.client.elo,
        power: summary.client.power,
        score: summary.client.score,
        eloChange: summary.client.eloChange,
      },
      gameMode: summary.gameMode,
    };
    return inversedSummary;
  }

  async end_game(game: Game) {
    game.room.status = 'gameOver';
    let elo = 0;
    if (game.gameState.score.client >= game.room.options.scoreMax) {
      elo = this.elo_calc(game.client, game.host);
      await this.summarize(game, elo);
      const data: GameSummaryData = this.summarizeEntityToData(
        game.gameSummary,
      );
      const revdata: GameSummaryData = this.inverseSummary(data);
      game.host.socket.emit('Lose', game.room, elo, data);
      game.client.socket.emit('Win', game.room, elo, revdata);
    } else if (game.gameState.score.host >= game.room.options.scoreMax) {
      elo = this.elo_calc(game.host, game.client);
      await this.summarize(game, elo);
      const data: GameSummaryData = this.summarizeEntityToData(
        game.gameSummary,
      );
      game.host.socket.emit('Win', game.room, elo, data);
      game.client.socket.emit(
        'Lose',
        game.room,
        elo,
        this.inverseSummary(data),
      );
    }
    game.host.status = 'idle';
    game.host.socket.leave(game.room.name);
    game.client.status = 'idle';
    game.client.socket.leave(game.room.name);
    game.theatre.viewers.forEach((element) => element.leave(game.theatre.name));
    this.games.splice(this.games.indexOf(game), 1);
  }

  async forfeit_game(winner: User, loser: User, game: Game) {
    const elo = this.elo_calc(winner, loser);
    await this.summarize(game, elo);
    const data: GameSummaryData = this.summarizeEntityToData(game.gameSummary);
    const revdata: GameSummaryData = this.inverseSummary(data);
    // this.summarize(game, elo);
    winner.socket.emit('Win', game.room, elo, data);
    loser.socket.emit('Lose', game.room, elo, revdata);
    game.host.status = 'idle';
    game.host.socket.leave(game.room.name);
    game.client.status = 'idle';
    game.client.socket.leave(game.room.name);
    game.theatre.viewers.forEach((element) => element.leave(game.theatre.name));
    this.games.splice(this.games.indexOf(game), 1);
    // this.userList.splice(this.userList.indexOf(loser), 1);
  }

  reconnect(player: User) {
    let game = this.games.find((element) => element.host.name === player.name);
    if (!game)
      game = this.games.find((element) => element.client.name === player.name);
    if (game) {
      player.socket.emit('reconnect', game.room);
      player.socket.join(game.room.name);
    }
  }

  newGame(client: User, host?: User) {
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
        options: defaultGameOptions,
      },
      theatre: {
        name: '',
        viewers: [],
      },
      gameState: {
        ball: {
          size: ballSize,
          pos: { x: 250, y: 250 },
          speed: { x: 2, y: 2 },
        },
        hostPower: new IPowerInfo(),
        clientPower: new IPowerInfo(),
        hostBar: {
          size: { x: 50 * defaultGameOptions.barSize, y: 10 },
          pos: { x: 250, y: 460 },
          speed: 0,
          smashing: false,
          maxSpeed: defaultGameOptions.barSpeed,
        },
        clientBar: {
          size: { x: 50 * defaultGameOptions.barSize, y: 10 },
          pos: { x: 250, y: 40 },
          speed: 0,
          smashing: false,
          maxSpeed: defaultGameOptions.barSpeed,
        },
        score: {
          client: 0,
          host: 0,
        },
      },
      host: undefined,
      client: client,
      gameSummary: null,
    };
    if (host) newGame.host = host;
    else newGame.host = this.playerQueue.shift();
    this.initPower(
      newGame.client,
      newGame.gameState,
      newGame.gameState.clientBar,
      newGame.gameState.hostBar,
    );
    this.initPower(
      newGame.host,
      newGame.gameState,
      newGame.gameState.hostBar,
      newGame.gameState.clientBar,
    );
    return newGame;
  }

  initGameValues(game: Game) {
    game.gameState.ball.speed.x *=
      game.room.options.ballSpeed == 0 ? 0.5 : game.room.options.ballSpeed;
    game.gameState.ball.speed.y *=
      game.room.options.ballSpeed == 0 ? 0.5 : game.room.options.ballSpeed;
    game.gameState.ball.size *=
      game.room.options.ballSize == 0 ? 0.5 : game.room.options.ballSize;
    game.gameState.clientBar.maxSpeed *=
      game.room.options.barSpeed == 0 ? 0.5 : game.room.options.barSpeed;
    game.gameState.clientBar.size.x *=
      game.room.options.barSize == 0 ? 0.5 : game.room.options.barSize;
    game.gameState.clientBar.size.y *=
      game.room.options.barSize == 0 ? 0.5 : game.room.options.barSize;
    game.gameState.hostBar.maxSpeed = game.gameState.clientBar.maxSpeed;
    game.gameState.hostBar.size.x = game.gameState.clientBar.size.x;
    game.gameState.hostBar.size.y = game.gameState.clientBar.size.y;
  }

  printList() {
    console.log('~~ player list ~~');
    this.userList.forEach((element) => {
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

  initPower(user: User, gameState: GameState, myBar: IBar, opponentBar: IBar) {
    if (user.gameData.power.name == 'elastico')
      user.gameData.power = new PowerElastico(myBar, user.gameData.power.name);
    else if (user.gameData.power.name == 'exhaust')
      user.gameData.power = new PowerExhaust(
        opponentBar,
        user.gameData.power.name,
      );
    else if (user.gameData.power.name == 'minimo')
      user.gameData.power = new PowerMinimo(
        opponentBar,
        user.gameData.power.name,
      );
    else if (user.gameData.power.name == 'invisibility')
      user.gameData.power = new PowerInvisibility(user.gameData.power.name);
  }

  handlePower(game: Game) {
    game.client.gameData.power.handle();
    game.host.gameData.power.handle();
  }

  SocketToPlayer(socket: Socket) {
    const player = this.userList.find((element) => element.socket === socket);
    if (player) return player;
    return;
  }

  PlayerToSocket(username: string) {
    const player = this.userList.find((element) => element.name === username);
    if (player) return player.socket;
    return;
  }

  async summarize(game: Game, elo: number) {
    try {
      const host: UserEntity = await this._userService.getUserByNickname(
        game.host.name,
      );
      const client: UserEntity = await this._userService.getUserByNickname(
        game.client.name,
      );
      const match = this._matchHistoryRepository.create({
        host,
        client,
        hostScore: game.gameState.score.host,
        hostPower: game.host.gameData.power.name,
        hostElo: game.host.gameData.elo,
        clientScore: game.gameState.score.client,
        clientPower: game.client.gameData.power.name,
        clientElo: game.client.gameData.elo,
        eloChange: elo,
        gameMode: '',
      });
      game.gameSummary = await this._matchHistoryRepository.save(match);
    } catch (error) {
      console.log(error);
    }
  }

  summarizeEntityToData(sum: MatchHistoryEntity) {
    const data: GameSummaryData = {
      host: {
        elo: sum.hostElo,
        name: sum.host.nickname,
        power: sum.hostPower,
        score: sum.hostScore,
        eloChange: sum.eloChange,
      },
      client: {
        elo: sum.clientElo,
        name: sum.client.nickname,
        power: sum.clientPower,
        score: sum.clientScore,
        eloChange: sum.eloChange,
      },
      gameMode: sum.gameMode,
    };
    return data;
  }

  async getMatchHistory(name: string) {
    return await this._matchHistoryRepository.find({
      where: [
        {
          host: { nickname: name },
        },
        {
          client: { nickname: name },
        },
      ],
    });
  }

  joinQueue(socket: Socket, powerName: string) {
    const player = this.userList.find((element) => element.socket === socket);
    if (!player) return;
    player.gameData.power = new IPower(powerName);
    if (this.playerQueue.find((element) => element === player))
      this.playerQueue.splice(this.playerQueue.indexOf(player), 1);
    if (this.playerQueue.length < 1) {
      this.playerQueue.push(player);
      player.status = 'inQueue';
    } else {
      const game = this.newGame(player);
      this.games.push(game);
      game.room.name = 'game-' + game.host.name + '-' + game.client.name;
      game.theatre.name = 'spec-' + game.host.name + '-' + game.client.name;
      game.host.status = 'inLobby';
      game.host.socket.join(game.room.name);
      game.client.status = 'inLobby';
      game.client.socket.join(game.room.name);
      console.log(game.client.socket.id + ' ' + game.host.socket.id);
      return game;
    }
    return null;
  }

  storeInput(socket: Socket, key: string) {
    const player = this.userList.find((element) => element.socket === socket);
    if (player) player.gameData.input.push(key);
  }

  updateMoveStatus(
    player: User,
    bar: IBar,
    playerType: string,
    gameOptions: GameOptions,
  ) {
    player.gameData.input.forEach((input) => {
      if (input === 'downSpace') player.gameData.power.active();
      else if (input === 'downRight')
        playerType === 'host'
          ? (player.gameData.right = true)
          : (player.gameData.left = true);
      else if (input === 'downLeft')
        playerType === 'host'
          ? (player.gameData.left = true)
          : (player.gameData.right = true);
      else if (input === 'upRight')
        playerType === 'host'
          ? (player.gameData.right = false)
          : (player.gameData.left = false);
      else if (input === 'upLeft')
        playerType === 'host'
          ? (player.gameData.left = false)
          : (player.gameData.right = false);
      else if (input === 'downA' && gameOptions.smashes) {
        player.gameData.smashLeft = 0.01;
        player.gameData.smashRight = 0;
        bar.smashing = true;
      } else if (input === 'downD' && gameOptions.smashes) {
        player.gameData.smashRight = 0.01;
        player.gameData.smashLeft = 0;
        bar.smashing = true;
      } else if (input === 'upA') {
        player.gameData.smashLeft = 0;
        bar.smashing = false;
      } else if (input === 'upD') {
        player.gameData.smashRight = 0;
        bar.smashing = false;
      }
    });
    player.gameData.input = [];
  }

  moveBar(bar: IBar, player: User, factor: number) {
    const speedLimit =
      player.gameData.smashLeft > 0 || player.gameData.smashRight > 0
        ? 2 * bar.maxSpeed
        : 7 * bar.maxSpeed;
    if (
      (player.gameData.left && player.gameData.right) ||
      (!player.gameData.left && !player.gameData.right)
    )
      bar.speed = 0;
    else if (player.gameData.left && !player.gameData.right) {
      if (bar.speed > -speedLimit) bar.speed -= factor == 0 ? 0.5 : 1 * factor;
    } else if (!player.gameData.left && player.gameData.right) {
      if (bar.speed < speedLimit) bar.speed += factor == 0 ? 0.5 : 1 * factor;
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
    host: User,
    client: User,
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
          if (client.gameData.power.isActive) {
            client.gameData.power.handle();
          } else if (room.options.smashes) client.gameData.power.chargeUp();
          if (client.gameData.smashLeft > 0) {
            ball.speed.x = 1 * M + client.gameData.smashLeft;
            ball.speed.y = 1 * M + client.gameData.smashLeft;
          } else if (client.gameData.smashRight > 0) {
            ball.speed.x = -1 * M - client.gameData.smashRight;
            ball.speed.y = 1 * M + client.gameData.smashRight;
          } else {
            ball.speed.y *= -1;
          }
          clientBar.smashing = false;
          client.gameData.smashLeft = 0;
          client.gameData.smashRight = 0;
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
          if (host.gameData.power.isActive) {
            host.gameData.power.handle();
          } else if (room.options.smashes) client.gameData.power.chargeUp();
          if (host.gameData.smashLeft > 0) {
            ball.speed.x = -1 * M - host.gameData.smashLeft;
            ball.speed.y = 1 * M + host.gameData.smashLeft;
          } else if (host.gameData.smashRight > 0) {
            ball.speed.x = 1 * M + host.gameData.smashRight;
            ball.speed.y = 1 * M + host.gameData.smashRight;
          } else {
            ball.speed.y *= -1;
          }
          hostBar.smashing = false;
          host.gameData.smashLeft = 0;
          host.gameData.smashRight = 0;
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
          if (!ball.speed.x) ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
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
      if (room.options.effects) this.applyEffect(room);
    }
    if (ball.pos.x + 16 > 500) {
      ball.speed.x *= -1;
      ball.pos.x = 500 - 16;
      if (room.options.effects) this.applyEffect(room);
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

  inverseState(gameState: GameState, game: Game) {
    const inverseState: GameState = {
      ball: {
        size: gameState.ball.size,
        pos: {
          x: 500 - JSON.parse(JSON.stringify(gameState.ball.pos.x)),
          y: 500 - JSON.parse(JSON.stringify(gameState.ball.pos.y)),
        },
        speed: gameState.ball.speed,
      },
      hostPower: {
        maxCharge: gameState.clientPower.maxCharge,
        currentCharge: gameState.clientPower.currentCharge,
        isActive: gameState.clientPower.isActive,
      },
      clientPower: {
        maxCharge: gameState.hostPower.maxCharge,
        currentCharge: gameState.hostPower.currentCharge,
        isActive: gameState.hostPower.isActive,
      },
      hostBar: {
        size: gameState.hostBar.size,
        pos: {
          x: 500 - gameState.hostBar.pos.x,
          y: 500 - gameState.hostBar.pos.y,
        },
        speed: gameState.hostBar.speed,
        smashing: gameState.hostBar.smashing,
        maxSpeed: gameState.hostBar.maxSpeed,
      },
      clientBar: {
        size: gameState.clientBar.size,
        pos: {
          x: 500 - gameState.clientBar.pos.x,
          y: 500 - gameState.clientBar.pos.y,
        },
        speed: gameState.clientBar.speed,
        smashing: gameState.clientBar.smashing,
        maxSpeed: gameState.clientBar.maxSpeed,
      },
      score: { host: gameState.score.client, client: gameState.score.host },
    };
    if (
      game.host.gameData.power.name == 'invisibility' &&
      game.host.gameData.power.trigger == true
    ) {
      inverseState.ball.pos.x = -50;
      inverseState.ball.pos.y = -50;
    }
    return inverseState;
  }

  sendState(gameState: GameState, game: Game) {
    const State: GameState = {
      ball: {
        size: gameState.ball.size,
        pos: {
          x: JSON.parse(JSON.stringify(gameState.ball.pos.x)),
          y: JSON.parse(JSON.stringify(gameState.ball.pos.y)),
        },
        speed: gameState.ball.speed,
      },
      clientPower: {
        maxCharge: gameState.clientPower.maxCharge,
        currentCharge: gameState.clientPower.currentCharge,
        isActive: gameState.clientPower.isActive,
      },
      hostPower: {
        maxCharge: gameState.hostPower.maxCharge,
        currentCharge: gameState.hostPower.currentCharge,
        isActive: gameState.hostPower.isActive,
      },
      hostBar: {
        size: gameState.hostBar.size,
        pos: {
          x: gameState.hostBar.pos.x,
          y: gameState.hostBar.pos.y,
        },
        speed: gameState.hostBar.speed,
        smashing: gameState.hostBar.smashing,
        maxSpeed: gameState.hostBar.maxSpeed,
      },
      clientBar: {
        size: gameState.clientBar.size,
        pos: {
          x: gameState.clientBar.pos.x,
          y: gameState.clientBar.pos.y,
        },
        speed: gameState.clientBar.speed,
        smashing: gameState.clientBar.smashing,
        maxSpeed: gameState.clientBar.maxSpeed,
      },
      score: { host: gameState.score.client, client: gameState.score.host },
    };
    if (
      game.client.gameData.power.name == 'invisibility' &&
      game.client.gameData.power.trigger == true
    ) {
      console.log('invis client');
      State.ball.pos.x = -5000;
      State.ball.pos.y = 250;
    }
    return State;
  }

  //need optional parameter speed
  getRandomStart() {
    const random = Math.random() * 3 + 1;
    const pos: IPoint = {
      x: (4 - random) * (Math.round(Math.random()) * 2 - 1),
      y: random * (Math.round(Math.random()) * 2 - 1),
    };
    return pos;
    // const pos: IPoint = { x: 0, y: 1 };
    // return pos;
  }

  resetGameState(game: Game) {
    const factor =
      game.room.options.ballSpeed == 0 ? 0.5 : game.room.options.ballSpeed;
    game.gameState.ball.pos = { x: 250, y: 250 };
    game.gameState.ball.speed = this.getRandomStart();
    game.gameState.ball.speed.x *= factor;
    game.gameState.ball.speed.y *= factor;
    game.gameState.hostBar.pos = { x: 250, y: 460 };
    game.gameState.hostBar.speed = 0;
    game.gameState.hostBar.smashing = false;
    game.gameState.clientBar.pos = { x: 250, y: 40 };
    game.gameState.clientBar.speed = 0;
    game.gameState.clientBar.smashing = false;
    game.room.barCollide = false;
    game.room.sideCollide = false;
    game.room.effect = 'null';
    game.host.gameData.smashLeft = 0;
    game.host.gameData.smashRight = 0;
    game.host.gameData.input = [];
    game.host.gameData.left = false;
    game.host.gameData.right = false;
    game.client.gameData.smashLeft = 0;
    game.client.gameData.smashRight = 0;
    game.client.gameData.input = [];
    game.client.gameData.left = false;
    game.client.gameData.right = false;
    game.client.gameData.power.reset();
    game.host.gameData.power.reset();
  }

  startRound(room: GameRoom) {
    room.kickOff = true;
    this.server.to(room.name).emit('kickOff');
    setTimeout(() => {
      room.kickOff = false;
      this.server.to(room.name).emit('play');
    }, 3000);
  }

  setPowerInfo(game: Game) {
    const gameState = game.gameState;

    gameState.hostPower = {
      maxCharge: game.host.gameData.power.maxCharge,
      currentCharge: game.host.gameData.power.currentCharge,
      isActive: game.host.gameData.power.isActive,
    };
    gameState.clientPower = {
      maxCharge: game.client.gameData.power.maxCharge,
      currentCharge: game.client.gameData.power.currentCharge,
      isActive: game.client.gameData.power.isActive,
    };
  }

  reset_collide(ball: IBall, room: GameRoom, game: Game) {
    if (room.barCollide && ball.speed.y > 0 && ball.pos.y > 250) {
      room.barCollide = false;
      room.sideCollide = false;
      if (
        game.client.gameData.power.name == 'invisibility' &&
        game.client.gameData.power.trigger
      )
        game.client.gameData.power.reset();
    } else if (room.barCollide && ball.speed.y < 0 && ball.pos.y < 250) {
      room.barCollide = false;
      room.sideCollide = false;
      if (
        game.host.gameData.power.name == 'invisibility' &&
        game.host.gameData.power.trigger
      )
        game.host.gameData.power.reset();
    }
  }

  nadal(ball: IBall, effect: string) {
    if (effect === 'doLeft') this.rotateVector(ball.speed, 0.2);
    else if (effect === 'doRight') this.rotateVector(ball.speed, -0.2);
  }

  chargeUp(game: Game) {
    if (
      game.client.gameData.smashLeft > 0 &&
      game.client.gameData.smashLeft <
        chargeMax * game.room.options.smashStrength
    ) {
      game.client.gameData.smashLeft += 0.01 * game.room.options.smashStrength;
    } else if (
      game.client.gameData.smashRight > 0 &&
      game.client.gameData.smashRight <
        chargeMax * game.room.options.smashStrength
    ) {
      game.client.gameData.smashRight += 0.01 * game.room.options.smashStrength;
    }
    if (
      game.host.gameData.smashLeft > 0 &&
      game.host.gameData.smashLeft < chargeMax * game.room.options.smashStrength
    ) {
      game.host.gameData.smashLeft += 0.01 * game.room.options.smashStrength;
    } else if (
      game.host.gameData.smashRight > 0 &&
      game.host.gameData.smashRight <
        chargeMax * game.room.options.smashStrength
    ) {
      game.host.gameData.smashRight += 0.01 * game.room.options.smashStrength;
    }
  }

  loop(game: Game) {
    if (!game.room.kickOff) {
      const gameState = game.gameState;
      this.updateMoveStatus(
        game.host,
        gameState.hostBar,
        'host',
        game.room.options,
      );
      this.updateMoveStatus(
        game.client,
        gameState.clientBar,
        'client',
        game.room.options,
      );
      if (game.room.options.smashes) this.chargeUp(game);
      //this.handlePower(game);
      this.moveBar(gameState.hostBar, game.host, game.room.options.barSpeed);
      this.moveBar(
        gameState.clientBar,
        game.client,
        game.room.options.barSpeed,
      );

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
      this.reset_collide(gameState.ball, game.room, game);
      gameState.ball.pos.x += gameState.ball.speed.x;
      gameState.ball.pos.y += gameState.ball.speed.y;

      this.goal(game);
      this.setPowerInfo(game);
    }
  }
}
