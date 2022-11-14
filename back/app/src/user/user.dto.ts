import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly nickname: string;

  readonly phone?: string;

  readonly password?: string;

  readonly intraId?: string;
}
