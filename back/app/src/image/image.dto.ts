import { IsString } from 'class-validator';

export class ImageDto {
  @IsString()
  readonly filename: string;

  @IsString()
  readonly path: string;

  @IsString()
  readonly mimetype: string;
}
