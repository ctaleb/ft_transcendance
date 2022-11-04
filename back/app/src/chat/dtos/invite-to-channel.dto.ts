import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class InviteToChannelDto {
  @IsNumber()
  @IsNotEmpty()
  readonly channelId: number;

  @IsString()
  @IsNotEmpty()
  readonly username: string;
}
