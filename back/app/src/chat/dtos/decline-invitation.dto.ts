import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeclineInvitationDto {
  @IsNumber()
  @IsNotEmpty()
  readonly id: number;
}
