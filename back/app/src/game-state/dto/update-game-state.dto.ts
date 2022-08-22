import { PartialType } from '@nestjs/mapped-types';
import { CreateGameStateDto } from './create-game-state.dto';

export class UpdateGameStateDto extends PartialType(CreateGameStateDto) {
  id: number;
}
