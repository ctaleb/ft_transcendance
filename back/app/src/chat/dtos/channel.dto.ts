import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChannelDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  readonly type?: string;

  readonly password?: string;
}
