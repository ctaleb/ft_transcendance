import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFriendListDto {
  @IsNumber()
  @IsNotEmpty()
  readonly requesterId: number;

  @IsNumber()
  @IsNotEmpty()
  readonly requesteeId: number;
}
