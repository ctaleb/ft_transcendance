import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { ServerService } from './server.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { Game } from './entities/server.entity';
import { UserEntity } from 'src/user/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

//implements for later? OnGatewayConnection, OnGatewayDisconnect: handleDisconnect, handleConnection
export class ServerGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly serverService: ServerService) {}

  afterInit(server: Server) {
    this.serverService.server = server;
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const hsToken = client.handshake.auth.token;
    const hsNick = client.handshake.auth.user.nickname;
    const user = this.serverService.playerList.find(
      (element) => element.name === hsNick,
    );
    if (user && user.token === hsToken) {
      user.socket = client;
      if (user.status === 'ready') this.serverService.reconnect(user);
    }
  }

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.serverService.create(
      createMessageDto,
      client.id,
      room,
    );

    this.server.to(room).emit('message', message);
    // client.to(room).emit('message', message);
    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll(@MessageBody('room') room: string) {
    return this.serverService.findAll(room);
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @MessageBody('room') room: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    client.join(room);
    return this.serverService.identify(name, client.id, room);
  }

  @SubscribeMessage('findAllUsers')
  findUsers(@MessageBody('room') room: string) {
    return this.serverService.findUsers(room);
  }

  gameLoop = (game: Game) => {
    // this.server.to(game.room.name).emit('ServerUpdate', game.gameState);
    game.host.socket.emit('ServerUpdate', game.gameState);
    game.client.socket.emit(
      'ServerUpdate',
      this.serverService.inverseState(game.gameState),
    );
    const loopTimer = setTimeout(() => {
      if (
        game.gameState.score.client >= game.room.options.scoreMax ||
        game.gameState.score.host >= game.room.options.scoreMax
      ) {
        clearTimeout(loopTimer);
        this.serverService.end_game(game);
        return;
      }
      this.serverService.loop(game);
      this.gameLoop(game);
    }, 10);
  };

  @SubscribeMessage('key')
  downLeft(
    @MessageBody('key') key: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    this.serverService.storeBarMove(client, key);
  }

  // Game Core
  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket) {
    const game = this.serverService.joinQueue(client);
    if (game) {
      this.server.to(game.room.name).emit('gameConfirmation', game.room);
      setTimeout(() => {
        if (game.host.status === 'ready' && game.client.status === 'ready') {
          game.room.status = 'playing';
          this.server.to(game.room.name).emit('startGame', game.room);
          this.serverService.startRound(game.room);
          this.gameLoop(game);
        } else {
          if (game.host.status === 'ready') {
            game.host.status = 'inQueue';
            game.client.status = 'idle';
            this.serverService.playerQueue.push(game.host);
          } else if (game.client.status === 'ready') {
            game.client.status = 'inQueue';
            game.host.status = 'idle';
            this.serverService.playerQueue.push(game.client);
          } else {
            game.host.status = 'idle';
            game.client.status = 'idle';
          }
          this.serverService.games.splice(
            this.serverService.games.indexOf(game),
            1,
          );
        }
      }, 5000);
    }
  }

  @SubscribeMessage('playerReady')
  playerReady(@ConnectedSocket() client: Socket) {
    this.serverService.playerList.find(
      (element) => element.socket === client,
    ).status = 'ready';
  }

  @SubscribeMessage('playerNotReady')
  playerNotReady(@ConnectedSocket() client: Socket) {
    this.serverService.playerList.find(
      (element) => element.socket === client,
    ).status = 'idle';
  }

  @SubscribeMessage('joiningPlayerList')
  joiningPlayerList(@ConnectedSocket() client: Socket) {
    // this.serverService.joiningPlayerList(client);
  }
}
