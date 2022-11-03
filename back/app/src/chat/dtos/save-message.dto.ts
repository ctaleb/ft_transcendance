import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveMessageDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @IsString()
  @IsNotEmpty()
  readonly content: string;
}
