import { IsNotEmpty, IsString } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  readonly type?: ChannelType;

  readonly password?: string;
}
