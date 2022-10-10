import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly nickname: string;

  @IsString()
  @IsNotEmpty()
  //@MinLength(9)
  @MaxLength(13)
  readonly phone: string;

  readonly password?: string;

  readonly intraId?: string;
}
