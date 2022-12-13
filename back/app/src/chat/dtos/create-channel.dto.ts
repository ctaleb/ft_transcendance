import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  readonly name: string;

  @IsString()
  readonly type?: ChannelType;

  readonly password?: string;
}
