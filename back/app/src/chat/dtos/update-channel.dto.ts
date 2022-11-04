import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class UpdateChannelDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @IsString()
  readonly type?: ChannelType;

  readonly password?: string;
}
