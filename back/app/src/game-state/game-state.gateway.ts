import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { GameStateService } from './game-state.service';
import { CreateGameStateDto } from './dto/create-game-state.dto';
import { UpdateGameStateDto } from './dto/update-game-state.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameStateGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameStateService: GameStateService) {}

  @SubscribeMessage('createGameState')
  //   create(@MessageBody() createGameStateDto: CreateGameStateDto) {
  //     return this.gameStateService.create(createGameStateDto);
  //   }

  //   @SubscribeMessage('findAllGameState')
  //   findAll() {
  //     return this.gameStateService.findAll();
  //   }

  //   @SubscribeMessage('findOneGameState')
  //   findOne(@MessageBody() id: number) {
  //     return this.gameStateService.findOne(id);
  //   }
  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket,
  ) {
    return this.gameStateService.identify(name, client.id);
  }

  @SubscribeMessage('updateGameState')
  update() {
    return this.gameStateService.update();
  }

  //   @SubscribeMessage('removeGameState')
  //   remove(@MessageBody() id: number) {
  //     return this.gameStateService.remove(id);
  //   }
}
