import { PartialType } from '@nestjs/mapped-types';
import { CreatePrivateConvDto } from './create-private_conv.dto';

export class UpdatePrivateConvDto extends PartialType(CreatePrivateConvDto) {
  id: number;
}
