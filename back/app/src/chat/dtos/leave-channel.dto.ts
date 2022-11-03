import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LeaveChannelDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;
}
