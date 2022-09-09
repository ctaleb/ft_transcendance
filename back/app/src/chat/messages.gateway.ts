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
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create(
      createMessageDto,
      client.id,
    );

    this.server.emit('message', message);

    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket,
  ) {
    return this.messagesService.identify(name, client.id);
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    const name = await this.messagesService.getClientName(client.id);

    client.broadcast.emit('typing', { name, isTyping });
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
