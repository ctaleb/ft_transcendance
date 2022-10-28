import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JoinChannelDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  readonly password?: string;
}
