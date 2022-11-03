import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetChannelsListDto {
  @IsNumber()
  @IsNotEmpty()
  readonly skip: number;
}
