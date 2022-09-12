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
import { Game } from './entities/message.entity';

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
    this.server
      .to(room)
      .emit('ServerUpdate', this.messagesService.updateGameState(room));
    setTimeout(() => {
      this.messagesService.loop(room);
      this.gameLoop(room);
    }, 10);
  };

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

  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket) {
    const game = this.messagesService.joinQueue(client);
    if (game) {
      this.messagesService.gameQueue.shift().join(game.room);
      this.messagesService.gameQueue.shift().join(game.room);
      this.server.to(game.room).emit('lobbyCreated', game);
    }
  }

  @SubscribeMessage('playerReady')
  launchGame(
    @MessageBody('clientGameState') clientGameState: Game,
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = this.messagesService.games.find(
      (game) => game.room === clientGameState.room,
    );
    if (gameState.ready === false) {
      gameState.ready = true;
      client.emit('yourehost');
    } else {
      gameState.gameOn = true;
      this.server.to(gameState.room).emit('startGame', gameState);
      this.gameLoop(gameState.room);
    }
  }
}
