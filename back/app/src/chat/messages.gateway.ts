import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { Game } from './entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

//implements for later? OnGatewayConnection, OnGatewayDisconnect: handleDisconnect, handleConnection
export class MessagesGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  afterInit(server: Server) {
    this.messagesService.server = server;
  }

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create(
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
    return this.messagesService.findAll(room);
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @MessageBody('room') room: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    client.join(room);
    return this.messagesService.identify(name, client.id, room);
  }

  @SubscribeMessage('findAllUsers')
  findUsers(@MessageBody('room') room: string) {
    return this.messagesService.findUsers(room);
  }

  gameLoop = (game: Game) => {
    // this.server.to(game.room.name).emit('ServerUpdate', game.gameState);
    game.host.socket.emit('ServerUpdate', game.gameState);
    game.client.socket.emit(
      'ServerUpdate',
      this.messagesService.inverseState(game.gameState),
    );
    const loopTimer = setTimeout(() => {
      if (
        game.gameState.score.client >= game.room.options.scoreMax ||
        game.gameState.score.host >= game.room.options.scoreMax
      ) {
        clearTimeout(loopTimer);
        game.room.status = 'gameOver';
        if (game.gameState.score.client >= game.room.options.scoreMax) {
          game.client.socket.emit('Win', game.room);
          game.host.socket.emit('Lose', game.room);
        } else if (game.gameState.score.host >= game.room.options.scoreMax) {
          game.client.socket.emit('Lose', game.room);
          game.host.socket.emit('Win', game.room);
        }
        return;
      }
      this.messagesService.loop(game);
      this.gameLoop(game);
    }, 10);
  };

  @SubscribeMessage('key')
  downLeft(
    @MessageBody('key') key: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    this.messagesService.storeBarMove(client, key);
  }

  // Game Core

  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket) {
    const game = this.messagesService.joinQueue(client);
    if (game) {
      this.server.to(game.room.name).emit('gameConfirmation', game.room);
      setTimeout(() => {
        if (game.host.status === 'ready' && game.client.status === 'ready') {
          game.room.status = 'playing';
          this.server.to(game.room.name).emit('startGame', game.room);
          this.messagesService.startRound(game.room);
          this.gameLoop(game);
        } else {
          if (game.host.status === 'ready') {
            game.host.status = 'inQueue';
            game.client.status = 'idle';
            this.messagesService.playerQueue.push(game.host);
          } else if (game.client.status === 'ready') {
            game.client.status = 'inQueue';
            game.host.status = 'idle';
            this.messagesService.playerQueue.push(game.client);
          } else {
            game.host.status = 'idle';
            game.client.status = 'idle';
          }
          this.messagesService.games.splice(
            this.messagesService.games.indexOf(game),
            1,
          );
        }
      }, 5000);
    }
  }

  @SubscribeMessage('playerReady')
  playerReady(@ConnectedSocket() client: Socket) {
    this.messagesService.playerList.find(
      (element) => element.socket === client,
    ).status = 'ready';
  }

  @SubscribeMessage('playerNotReady')
  playerNotReady(@ConnectedSocket() client: Socket) {
    this.messagesService.playerList.find(
      (element) => element.socket === client,
    ).status = 'idle';
  }

  @SubscribeMessage('joiningPlayerList')
  joiningPlayerList(@ConnectedSocket() client: Socket) {
    this.messagesService.joiningPlayerList(client);
  }
}
