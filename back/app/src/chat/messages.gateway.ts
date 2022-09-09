import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { GameState } from 'src/game.core';
import { RouterModule } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

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

  gameLoop = (room: string) => {
    this.messagesService.loop(room);
    this.server
      .to(room)
      .emit('ServerUpdate', this.messagesService.updateGameState(room));
    setTimeout(() => {
      this.gameLoop(room);
    }, 10);
  };

  @SubscribeMessage('joinGame')
  joinGame(
    @MessageBody('room') room: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    client.join(room);
    if (!this.messagesService.joiningGame(room)) {
      this.gameLoop(room);
      return 'host';
    }
    return 'client';
  }

  @SubscribeMessage('key')
  downLeft(
    @MessageBody('room') room: string,
    @MessageBody('clientStatus') clientStatus: string,
    @MessageBody('key') key: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    this.messagesService.storeBarMove(room, clientStatus, key);
  }

  // Game Core

  private gameQueue: Socket[] = [];
  private gameStates: GameState[] = [];

  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket) {
    this.gameQueue.push(client);
    if (this.gameQueue.length > 1) {
      let gameState: GameState = {
        room: `game-${this.gameStates.length}`,
        gameOn: false,
        ready: false,
      };
      this.gameQueue.shift().join(gameState.room);
      this.gameQueue.shift().join(gameState.room);
      this.gameStates.push(gameState);
      this.server.to(gameState.room).emit('lobbyCreated', gameState);
    }
  }

  @SubscribeMessage('playerReady')
  launchGame(@MessageBody('cGameState') cGameState: GameState) {
    const gameState = this.gameStates.find(
      (game) => game.room === cGameState.room,
    );
    if (gameState.ready === false) {
      gameState.ready = true;
    } else {
      gameState.gameOn = true;
      this.server.to(gameState.room).emit('startGame', gameState);
    }
  }
}
