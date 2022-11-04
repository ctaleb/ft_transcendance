import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChangeRoleDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;

  @IsString()
  @IsNotEmpty()
  readonly username: string;
}
