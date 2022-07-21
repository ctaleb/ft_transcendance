import { IsEmpty, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmpty()
  id: number;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;
}
