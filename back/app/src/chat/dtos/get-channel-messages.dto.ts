import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetChannelMessagesDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @IsNumber()
  @IsNotEmpty()
  readonly skip: number;
}
