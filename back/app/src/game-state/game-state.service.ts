import { Injectable } from '@nestjs/common';
import { CreateGameStateDto } from './dto/create-game-state.dto';
import { UpdateGameStateDto } from './dto/update-game-state.dto';
import { GameState, IPoint } from './entities/game-state.entity';

@Injectable()
export class GameStateService {
  StartPoint: IPoint = {
    x: 200,
    y: 200,
  };
  //   gameState: GameState = {
  //     ball: this.StartPoint,
  //   };

  clientToUser = {};
  id = 0;

  //   create(createGameStateDto: CreateGameStateDto) {
  //     return 'This action adds a new gameState';
  //   }

  //   findAll() {
  //     return `This action returns all gameState`;
  //   }

  //   findOne(id: number) {
  //     return `This action returns a #${id} gameState`;
  //   }

  identify(clientId: string) {
    this.clientToUser[clientId] = this.id;
    this.id++;

    return Object.values(this.clientToUser);
  }

  update() {
    // return this.gameState.ball;
    // return `This action updates a #${id} gameState`;
  }
}
