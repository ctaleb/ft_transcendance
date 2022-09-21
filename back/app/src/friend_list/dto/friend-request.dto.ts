import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FriendRequestDto {
  @IsNumber()
  @IsNotEmpty()
  readonly requesterId: number;

  @IsString()
  @IsNotEmpty()
  readonly requesteeName: string;
}
