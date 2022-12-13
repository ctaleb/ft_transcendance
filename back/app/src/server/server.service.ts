import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { timeout } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { Channel } from './entities/channel';
import { GameSummaryData, MatchHistoryEntity } from './entities/match_history.entity';
import {
  ChatRoom,
  Game,
  GameOptions,
  GameRoom,
  GameState,
  IBall,
  IBar,
  IPoint,
  IPower,
  IPowerInfo,
  PowerElastico,
  PowerExhaust,
  PowerInvisibility,
  PowerMinimo,
  PowerSmasher,
  User,
} from './entities/server.entity';

const chargeMax = 1;
const ballSize = 16;
const defaultGameOptions: GameOptions = {
  scoreMax: 5,
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
    private _userService: UserService,
    private _chatService: ChatService,
  ) {}

  //generic stuff
  async newUser(token: string, user: string, sock?: Socket) {
    const bdd_user: UserEntity = await this._userService.getUserByNickname(user).catch();
    if (bdd_user) {
      const newUser: User = {
        token: token,
        socket: sock,
        name: user,
        id: bdd_user.id,
        status: 'online',
        gameData: {
          input: [],
          left: false,
          right: false,
          elo: bdd_user.elo,
          smashLeft: 0,
          smashRight: 0,
          status: 'idle',
          power: new IPower('init'),
        },
        chatData: {
          RoomList: [],
        },
      };
      this.updateStatus(newUser.id, 'online');
      this.userList.push(newUser);
    }
  }

  //status stuff
  async updateStatus(id: number, status: string) {
    await this._userService.updateStatus(id, status);
    this.server.emit('updateOneUserStatus', { id, status });
  }

  stopCustom(opponent: User, self: User, game: Game) {
    self.gameData.status = 'idle';
    this.updateStatus(self.id, 'online');
    self.socket.leave(game.room.name);
    opponent.gameData.status = 'idle';
    this.updateStatus(opponent.id, 'online');
    opponent.socket.leave(game.room.name);
    opponent.socket.emit('foreverAlone', self.name);
    this.games.splice(this.games.indexOf(game), 1);
  }

  //game stuff
  async elo_calc(winner: User, loser: User) {
    const oldElo = winner.gameData.elo;
    const Kfactor = 25;
    const R1 = Math.pow(10, winner.gameData.elo / 400);
    const R2 = Math.pow(10, loser.gameData.elo / 400);
    const E1 = R1 / (R1 + R2);
    const E2 = R2 / (R1 + R2);
    console.log('elo calc:');
    console.log(`   old elo winner: ${winner.gameData.elo}  looser: ${loser.gameData.elo}`);
    winner.gameData.elo = Math.floor(winner.gameData.elo + Kfactor * (1 - E1));
    loser.gameData.elo = Math.ceil(loser.gameData.elo + Kfactor * (0 - E2));
    console.log(`   new elo winner: ${winner.gameData.elo}  looser: ${loser.gameData.elo}`);
    this._userService.updateElo(winner.gameData.elo, winner.id);
    this._userService.updateElo(loser.gameData.elo, loser.id);
    console.log(`   elo diff: ${winner.gameData.elo - oldElo}`);
    return winner.gameData.elo - oldElo;
  }

  inverseSummary(summary: GameSummaryData) {
    const inversedSummary: GameSummaryData = {
      client: {
        id: summary.host.id,
        name: summary.host.name,
        elo: summary.host.elo,
        power: summary.host.power,
        score: summary.host.score,
        eloChange: summary.host.eloChange,
      },
      host: {
        id: summary.client.id,
        name: summary.client.name,
        elo: summary.client.elo,
        power: summary.client.power,
        score: summary.client.score,
        eloChange: summary.client.eloChange,
      },
      gameMode: summary.gameMode,
      winnerID: summary.winnerID,
    };
    return inversedSummary;
  }

  async end_game(game: Game) {
    game.room.status = 'gameOver';
    let elo = 0;
    let spectator: User;
    game.room.opponent = instanceToPlain(await this._userService.getUserByNickname(game.client.name));
    game.room.host = instanceToPlain(await this._userService.getUserByNickname(game.host.name));
    if (game.gameState.score.client >= game.room.options.scoreMax) {
      elo = await this.elo_calc(game.client, game.host);
      await this.summarize(game, elo, game.client.id);
      const data: GameSummaryData = this.summarizeEntityToData(game.gameSummary, game.client.id);
      const revdata: GameSummaryData = this.inverseSummary(data);
      game.room.end = new Date();
      game.host.socket.emit('Lose', game.room, elo, data);
      game.client.socket.emit('Win', game.room, elo, revdata);
      this.server.to(game.theatre.name).emit('endGame', game.room, elo, data, game.client.name);
    } else if (game.gameState.score.host >= game.room.options.scoreMax) {
      elo = await this.elo_calc(game.host, game.client);
      await this.summarize(game, elo, game.host.id);
      const data: GameSummaryData = this.summarizeEntityToData(game.gameSummary, game.host.id);
      game.room.end = new Date();
      game.host.socket.emit('Win', game.room, elo, data);
      game.client.socket.emit('Lose', game.room, elo, this.inverseSummary(data));
      this.server.to(game.theatre.name).emit('endGame', game.room, elo, data, game.host.name);
    }
    game.host.gameData.status = 'idle';
    this.updateStatus(game.host.id, 'online');
    game.host.socket.leave(game.room.name);
    game.client.gameData.status = 'idle';
    this.updateStatus(game.client.id, 'online');
    game.client.socket.leave(game.room.name);
    game.theatre.viewers.forEach((element) => {
      spectator = this.userList.find((usr) => usr.socket.id === element.id);
      if (spectator) {
        spectator.status = 'online';
        this.updateStatus(spectator.id, 'online');
      }
      element.leave(game.theatre.name);
    });
    this.games.splice(this.games.indexOf(game), 1);
  }

  async forfeit_game(winner: User, loser: User, game: Game) {
    const elo = await this.elo_calc(winner, loser);
    await this.summarize(game, elo, winner.id);
    const data: GameSummaryData = this.summarizeEntityToData(game.gameSummary, winner.id);
    const revdata: GameSummaryData = this.inverseSummary(data);
    // this.summarize(game, elo);
    game.room.opponent = instanceToPlain(await this._userService.getUserByNickname(game.client.name));
    game.room.host = instanceToPlain(await this._userService.getUserByNickname(game.host.name));
    game.room.end = new Date();
    winner.socket.emit('Win', game.room, elo, data);
    loser.socket.emit('Lose', game.room, elo, revdata);
    this.server.to(game.theatre.name).emit('endGame', game.room, elo, data, winner.name);
    game.host.gameData.status = 'idle';
    this.updateStatus(game.host.id, 'online');
    game.host.socket.leave(game.room.name);
    game.client.gameData.status = 'idle';
    this.updateStatus(game.client.id, 'online');
    game.client.socket.leave(game.room.name);
    game.theatre.viewers.forEach((element) => {
      const spectator = this.userList.find((usr) => usr.socket.id === element.id);
      if (spectator) {
        spectator.status = 'online';
        this.updateStatus(spectator.id, 'online');
      }
      element.leave(game.theatre.name);
    });
    this.games.splice(this.games.indexOf(game), 1);
    // this.userList.splice(this.userList.indexOf(loser), 1);
  }

  reconnect(player: User) {
    this.updateStatus(player.id, 'online');
    let game = this.games.find((element) => element.host.name === player.name);
    if (game) {
      if (game.room.status != 'launching') {
        game.room.status = 'hostForfeit';
        return;
      } else {
        this.stopCustom(game.client, game.host, game);
        return;
      }
    } else {
      game = this.games.find((element) => element.client.name === player.name);
    }
    if (game) {
      if (game.room.status != 'launching') {
        game.room.status = 'clientForfeit';
      } else {
        this.stopCustom(game.host, game.client, game);
      }
    }
  }

  newGame(client: User, host?: User) {
    const newGame: Game = {
      room: {
        name: '',
        hostName: '',
        clientName: '',
        status: 'launching',
        opponent: null,
        host: null,
        kickOff: false,
        barCollide: false,
        sideCollide: false,
        effect: 'null',
        start: new Date(),
        end: new Date(),
        options: defaultGameOptions,
      },
      theatre: {
        name: '',
        viewers: [],
      },
      gameState: {
        frame: 0,
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
        hit: { x: 0, y: 0, hit: 0 },
        state: 'start',
      },
      host: undefined,
      client: client,
      gameSummary: null,
    };
    if (host) newGame.host = host;
    else newGame.host = this.playerQueue.shift();
    this.initPower(newGame.client, newGame.gameState, newGame.gameState.clientBar, newGame.gameState.hostBar);
    this.initPower(newGame.host, newGame.gameState, newGame.gameState.hostBar, newGame.gameState.clientBar);
    return newGame;
  }

  initGameValues(game: Game) {
    game.gameState.ball.speed.x *= game.room.options.ballSpeed == 0 ? 0.5 : game.room.options.ballSpeed;
    game.gameState.ball.speed.y *= game.room.options.ballSpeed == 0 ? 0.5 : game.room.options.ballSpeed;
    game.gameState.ball.size *= game.room.options.ballSize == 0 ? 0.5 : game.room.options.ballSize;
    game.gameState.clientBar.maxSpeed *= game.room.options.barSpeed == 0 ? 0.5 : game.room.options.barSpeed;
    game.gameState.clientBar.size.x *= game.room.options.barSize == 0 ? 0.5 : game.room.options.barSize;
    game.gameState.clientBar.size.y *= game.room.options.barSize == 0 ? 0.5 : game.room.options.barSize;
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
    if (user.gameData.power.name == 'Elastico') user.gameData.power = new PowerElastico(myBar, user.gameData.power.name);
    else if (user.gameData.power.name == 'Exhaust') user.gameData.power = new PowerExhaust(opponentBar, user.gameData.power.name);
    else if (user.gameData.power.name == 'Minimo') user.gameData.power = new PowerMinimo(opponentBar, user.gameData.power.name);
    else if (user.gameData.power.name == 'Ghost') user.gameData.power = new PowerInvisibility(user.gameData.power.name);
    else if (user.gameData.power.name == 'Smasher') user.gameData.power = new PowerSmasher(gameState.ball, user.gameData.power.name);
  }

  SocketToPlayer(socket: Socket) {
    const player = this.userList.find((element) => element.socket === socket);
    if (player) return player;
    return;
  }

  PlayerToSocket(username: string) {
    const player = this.userList.find((element) => element.name === username);
    if (player) return player.socket;
    return undefined;
  }

  async summarize(game: Game, elo: number, victor: number) {
    try {
      const host: UserEntity = await this._userService.getUserByNickname(game.host.name);
      const client: UserEntity = await this._userService.getUserByNickname(game.client.name);
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
        winnerID: victor,
      });
      game.gameSummary = await this._matchHistoryRepository.save(match);
    } catch (error) {
      console.log(error);
    }
  }

  summarizeEntityToData(sum: MatchHistoryEntity, victor: number) {
    const data: GameSummaryData = {
      host: {
        id: sum.host.id,
        elo: sum.hostElo,
        name: sum.host.nickname,
        power: sum.hostPower,
        score: sum.hostScore,
        eloChange: sum.eloChange,
      },
      client: {
        id: sum.client.id,
        elo: sum.clientElo,
        name: sum.client.nickname,
        power: sum.clientPower,
        score: sum.clientScore,
        eloChange: sum.eloChange,
      },
      gameMode: sum.gameMode,
      winnerID: victor,
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
      order: { createdAt: 'DESC' },
    });
  }

  joinQueue(socket: Socket, powerName: string) {
    const player = this.userList.find((element) => element.socket === socket);
    if (!player) return;
    console.log(powerName);
    player.gameData.power = new IPower(powerName);
    if (this.playerQueue.find((element) => element === player)) this.playerQueue.splice(this.playerQueue.indexOf(player), 1);
    if (this.playerQueue.length < 1) {
      this.playerQueue.push(player);
      player.status = 'inQueue';
      this.updateStatus(player.id, 'inQueue');
    } else {
      const game = this.newGame(player);
      this.games.push(game);
      game.room.name = 'game-' + game.host.name + '-' + game.client.name;
      game.theatre.name = 'spec-' + game.host.name + '-' + game.client.name;
      game.host.gameData.status = 'inLobby';
      this.updateStatus(game.host.id, 'inLobby');
      game.host.socket.join(game.room.name);
      game.client.gameData.status = 'inLobby';
      this.updateStatus(game.client.id, 'inLobby');
      game.client.socket.join(game.room.name);
      return game;
    }
    return null;
  }

  storeInput(socket: Socket, key: string) {
    const player = this.userList.find((element) => element.socket === socket);
    if (player) player.gameData.input.push(key);
  }

  updateMoveStatus(player: User, bar: IBar, playerType: string, gameOptions: GameOptions) {
    player.gameData.input.forEach((input) => {
      if (input === 'downSpace') {
        player.gameData.power.active();
      } else if (input === 'downRight') playerType === 'host' ? (player.gameData.right = true) : (player.gameData.left = true);
      else if (input === 'downLeft') playerType === 'host' ? (player.gameData.left = true) : (player.gameData.right = true);
      else if (input === 'upRight') playerType === 'host' ? (player.gameData.right = false) : (player.gameData.left = false);
      else if (input === 'upLeft') playerType === 'host' ? (player.gameData.left = false) : (player.gameData.right = false);
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
    const speedLimit = player.gameData.smashLeft > 0 || player.gameData.smashRight > 0 ? 2 * bar.maxSpeed : 7 * bar.maxSpeed;
    if ((player.gameData.left && player.gameData.right) || (!player.gameData.left && !player.gameData.right)) bar.speed = 0;
    else if (player.gameData.left && !player.gameData.right) {
      if (bar.speed > -speedLimit) bar.speed -= factor == 0 ? 0.5 : 1 * factor;
    } else if (!player.gameData.left && player.gameData.right) {
      if (bar.speed < speedLimit) bar.speed += factor == 0 ? 0.5 : 1 * factor;
    }

    if ((bar.pos.x + bar.speed > bar.size.x && bar.speed < 0) || (bar.pos.x + bar.speed < 500 - bar.size.x && bar.speed > 0)) bar.pos.x += bar.speed;
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

  barBallCollision(hostBar: IBar, clientBar: IBar, ball: IBall, room: GameRoom, host: User, client: User, gameState: GameState) {
    if (!room.barCollide) {
      if (ball.pos.y - ball.size <= clientBar.pos.y + clientBar.size.y && ball.pos.y > clientBar.pos.y + clientBar.size.y) {
        if (ball.pos.x < clientBar.pos.x + clientBar.size.x + ball.size && ball.pos.x > clientBar.pos.x - clientBar.size.x - ball.size) {
          room.barCollide = true;
          const M = (Math.sqrt(Math.pow(ball.speed.x, 2) + Math.pow(ball.speed.y, 2)) / Math.sqrt(2)) * 1.05;
          if (room.options.smashes) {
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
            ball.pos.y += ball.speed.y;
          } else {
            ball.speed.y *= -1;
          }
          if (room.options.powers && client.gameData.power.isActive) {
            client.gameData.power.handle();
          } else if (room.options.powers) {
            client.gameData.power.chargeUp();
          }
          gameState.hit.x = gameState.ball.pos.x;
          gameState.hit.y = gameState.ball.pos.y;
          gameState.hit.hit = 2;
          this.storeEffect(clientBar, room);
        }
      }
      if (ball.pos.y + ball.size >= hostBar.pos.y - hostBar.size.y && ball.pos.y < hostBar.pos.y - hostBar.size.y) {
        if (ball.pos.x < hostBar.pos.x + hostBar.size.x + ball.size && ball.pos.x > hostBar.pos.x - hostBar.size.x - ball.size) {
          room.barCollide = true;
          const M = (Math.sqrt(Math.pow(ball.speed.x, 2) + Math.pow(ball.speed.y, 2)) / Math.sqrt(2)) * 1.05;
          if (room.options.smashes) {
            if (host.gameData.smashLeft > 0) {
              ball.speed.x = -1 * M - host.gameData.smashLeft;
              ball.speed.y = -1 * M + host.gameData.smashLeft;
            } else if (host.gameData.smashRight > 0) {
              ball.speed.x = 1 * M + host.gameData.smashRight;
              ball.speed.y = -1 * M + host.gameData.smashRight;
            } else {
              ball.speed.y *= -1;
            }
            hostBar.smashing = false;
            host.gameData.smashLeft = 0;
            host.gameData.smashRight = 0;
            ball.pos.y += ball.speed.y;
          } else {
            ball.speed.y *= -1;
          }
          if (room.options.powers && host.gameData.power.isActive) host.gameData.power.handle();
          else if (room.options.powers) {
            host.gameData.power.chargeUp();
          }
          gameState.hit.x = gameState.ball.pos.x;
          gameState.hit.y = gameState.ball.pos.y;
          gameState.hit.hit = 2;
          this.storeEffect(hostBar, room);
        }
      }
    }
    if (!room.sideCollide) {
      if (ball.pos.x > clientBar.pos.x + clientBar.size.x && ball.pos.x - ball.size < clientBar.pos.x + clientBar.size.x) {
        if (ball.pos.y - ball.size < clientBar.pos.y) {
          if (!ball.speed.x) ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
        }
      } else if (ball.pos.x < clientBar.pos.x - clientBar.size.x && ball.pos.x + ball.size > clientBar.pos.x - clientBar.size.x) {
        if (ball.pos.y - ball.size < clientBar.pos.y) {
          if (ball.speed.x) ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
        }
      }
      if (ball.pos.x > hostBar.pos.x + hostBar.size.x && ball.pos.x - ball.size < hostBar.pos.x + hostBar.size.x) {
        if (ball.pos.y + ball.size > hostBar.pos.y) {
          if (!ball.speed.x) ball.speed.x *= -1;
          ball.pos.y += ball.speed.y;
          ball.pos.x += ball.speed.x;
          room.sideCollide = true;
        }
      } else if (ball.pos.x < hostBar.pos.x - hostBar.size.x && ball.pos.x + ball.size > hostBar.pos.x - hostBar.size.x) {
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

  wallBallCollision(state: GameState, room: GameRoom) {
    if (state.ball.pos.x - 16 <= 0) {
      state.ball.speed.x *= -1;
      state.hit.x = 0;
      state.hit.y = state.ball.pos.y;
      state.hit.hit = 1;
      state.ball.pos.x = 0 + 16;
      if (room.options.effects) this.applyEffect(room);
    }
    if (state.ball.pos.x + 16 > 500) {
      state.ball.speed.x *= -1;
      state.hit.x = 500;
      state.hit.y = state.ball.pos.y;
      state.hit.hit = 1;
      state.ball.pos.x = 500 - 16;
      if (room.options.effects) this.applyEffect(room);
    }
  }

  goal(game: Game) {
    if (game.gameState.ball.pos.y < 0 - game.gameState.ball.size || game.gameState.ball.pos.y > 500 + game.gameState.ball.size) {
      if (game.gameState.ball.pos.y < 0) {
        game.gameState.score.host += 1;
      } else {
        game.gameState.score.client += 1;
      }
      game.gameState.hit.x = game.gameState.ball.pos.x;
      game.gameState.hit.y = game.gameState.ball.pos.y;
      game.gameState.hit.hit = 3;
      game.gameState.state = 'stop';
      setTimeout(() => {
        this.resetGameState(game);
        game.gameState.state = 'kickoff';
        setTimeout(() => {
          game.gameState.state = 'play';
        }, 3000);
      }, 2000);
    }
  }

  inverseState(gameState: GameState, game: Game) {
    const inverseState: GameState = {
      frame: gameState.frame,
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
      hit: { x: 500 - gameState.hit.x, y: 500 - gameState.hit.y, hit: gameState.hit.hit },
      state: gameState.state,
    };
    if (game.host.gameData.power.name == 'invisibility' && game.host.gameData.power.trigger == true) {
      inverseState.ball.pos.x = -50;
      inverseState.ball.pos.y = -50;
    }
    return inverseState;
  }

  sendState(gameState: GameState, game: Game) {
    const State: GameState = {
      frame: gameState.frame,
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
      score: { host: gameState.score.host, client: gameState.score.client },
      hit: { x: gameState.hit.x, y: gameState.hit.y, hit: gameState.hit.hit },
      state: gameState.state,
    };
    if (game.client.gameData.power.name == 'invisibility' && game.client.gameData.power.trigger == true) {
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
    const factor = game.room.options.ballSpeed == 0 ? 0.5 : game.room.options.ballSpeed;
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
    game.gameState.hit.hit = 0;
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
      if (game.client.gameData.power.name == 'invisibility' && game.client.gameData.power.trigger) game.client.gameData.power.reset();
    } else if (room.barCollide && ball.speed.y < 0 && ball.pos.y < 250) {
      room.barCollide = false;
      room.sideCollide = false;
      if (game.host.gameData.power.name == 'invisibility' && game.host.gameData.power.trigger) game.host.gameData.power.reset();
    }
  }

  nadal(ball: IBall, effect: string) {
    if (effect === 'doLeft') this.rotateVector(ball.speed, 0.2);
    else if (effect === 'doRight') this.rotateVector(ball.speed, -0.2);
  }

  resetHit(state: GameState) {
    state.hit.x = 0;
    state.hit.y = 0;
    if (state.hit.hit != 3) state.hit.hit = 0;
  }

  chargeUp(game: Game) {
    if (game.client.gameData.smashLeft > 0 && game.client.gameData.smashLeft < chargeMax * game.room.options.smashStrength) {
      game.client.gameData.smashLeft += 0.01 * game.room.options.smashStrength;
    } else if (game.client.gameData.smashRight > 0 && game.client.gameData.smashRight < chargeMax * game.room.options.smashStrength) {
      game.client.gameData.smashRight += 0.01 * game.room.options.smashStrength;
    }
    if (game.host.gameData.smashLeft > 0 && game.host.gameData.smashLeft < chargeMax * game.room.options.smashStrength) {
      game.host.gameData.smashLeft += 0.01 * game.room.options.smashStrength;
    } else if (game.host.gameData.smashRight > 0 && game.host.gameData.smashRight < chargeMax * game.room.options.smashStrength) {
      game.host.gameData.smashRight += 0.01 * game.room.options.smashStrength;
    }
  }

  loop(game: Game) {
    if (game.gameState.state == 'play') {
      const gameState = game.gameState;
      gameState.frame++;
      this.resetHit(game.gameState);
      this.updateMoveStatus(game.host, gameState.hostBar, 'host', game.room.options);
      this.updateMoveStatus(game.client, gameState.clientBar, 'client', game.room.options);
      if (game.room.options.smashes) this.chargeUp(game);
      this.moveBar(gameState.hostBar, game.host, game.room.options.barSpeed);
      this.moveBar(gameState.clientBar, game.client, game.room.options.barSpeed);
      this.barBallCollision(gameState.hostBar, gameState.clientBar, gameState.ball, game.room, game.host, game.client, gameState);
      this.wallBallCollision(gameState, game.room);
      this.reset_collide(gameState.ball, game.room, game);
      this.nadal(gameState.ball, game.room.effect);
      gameState.ball.pos.x += gameState.ball.speed.x;
      gameState.ball.pos.y += gameState.ball.speed.y;
      this.goal(game);
      this.setPowerInfo(game);
    } else if (game.gameState.state == 'start') {
      game.gameState.state = 'kickoff';
      this.resetGameState(game);
      setTimeout(() => {
        game.gameState.state = 'play';
      }, 3000);
    }
  }

  // GOAT
  async joinAllChannels(socket: Socket, userId: number) {
    let channels = await this._chatService.getUserChannels(userId);
    const bannedChannels = await this._chatService.getUsersBannedChannels(userId);
    channels = channels.filter((el) => !bannedChannels.find((chan) => chan.id === el.id));
    channels.forEach((ell) => {
      socket.join(`${ell.id}`);
    });
  }

  async sendChannelMessage(channelId: number, channelName: string, content: string, userId: number) {
    let error: string;
    await this._chatService
      .saveMessage({ id: channelId, content: content }, userId)
      .then((data) => {
        this.server.to(`${channelId}`).emit('messageReceived', channelId, channelName, data);
      })
      .catch((err) => {
        error = err.message;
      });
    return error;
  }

  async updateChannelMembers(channelId: number, client: Socket) {
    const channels = await this._chatService.getUserChannels(client.handshake.auth.user.id);
    if (channels.find((ell) => ell.id === channelId)) {
      this.server.to(`${channelId}`).emit('updateChannelMembers', channelId);
    }
  }

  async joinChannelRoom(client: Socket, channelId: number) {
    const channels = await this._chatService.getUserChannels(client.handshake.auth.user.id);
    if (channels.find((ell) => ell.id === channelId)) {
      this.server.to(`${channelId}`).emit('updateChannelMembers', channelId);
      client.join(`${channelId}`);
    }
  }

  async leaveChannelRoom(client: Socket, channelId: number) {
    this.server.to(`${channelId}`).emit('updateChannelMembers', channelId);
    client.leave(`${channelId}`);
  }

  async updateChannel(client: Socket, id: number, name: string, type: string) {
    const channels = await this._chatService.getUserChannels(client.handshake.auth.user.id);
    const channel = channels.find((ell) => ell.id === id);
    if (channel) {
      this.server.to(`${channel.id}`).emit('channelUpdatd', { id: channel.id, name: channel.name, type: channel.type });
    }
  }
}
