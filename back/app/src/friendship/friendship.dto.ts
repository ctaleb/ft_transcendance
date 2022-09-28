import { IsNotEmpty, IsString } from 'class-validator';

export class FriendshipDto {
  @IsString()
  @IsNotEmpty()
  readonly requester: string;

  @IsString()
  @IsNotEmpty()
  readonly addressee: string;
}
