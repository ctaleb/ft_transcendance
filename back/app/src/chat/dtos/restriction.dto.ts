import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RestrictionDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsNumber()
  @IsNotEmpty()
  readonly minutes: number;
}
