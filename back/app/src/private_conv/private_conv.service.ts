import { Injectable } from '@nestjs/common';
import { CreatePrivateConvDto } from './dto/create-private_conv.dto';
import { UpdatePrivateConvDto } from './dto/update-private_conv.dto';

@Injectable()
export class PrivateConvService {
  create(createPrivateConvDto: CreatePrivateConvDto) {
    return 'This action adds a new privateConv';
  }

  findAll() {
    return `This action returns all privateConv`;
  }

  findOne(id: number) {
    return `This action returns a #${id} privateConv`;
  }

  update(id: number, updatePrivateConvDto: UpdatePrivateConvDto) {
    return `This action updates a #${id} privateConv`;
  }

  remove(id: number) {
    return `This action removes a #${id} privateConv`;
  }
}
