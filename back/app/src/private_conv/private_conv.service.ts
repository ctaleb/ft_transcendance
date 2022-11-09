import { string } from '@hapi/joi';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { messageParamsFactory } from '@vuelidate/validators';
import { authorize } from 'passport';
import { User } from 'src/server/entities/server.entity';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { CreatePrivateConvDto } from './dto/create-private_conv.dto';
import { MessageDto } from './dto/MessageDto';
import { UpdatePrivateConvDto } from './dto/update-private_conv.dto';
import { PrivateMessageEntity } from './entities/privateMessage.entity';
import { PrivateConvEntity } from './entities/private_conv.entity';

@Injectable()
export class PrivateConvService {
  constructor(
    @InjectRepository(PrivateMessageEntity)
    private privateMessagesRepository: Repository<PrivateMessageEntity>,
    @InjectRepository(PrivateConvEntity)
    private privateConvRepository: Repository<PrivateConvEntity>,
  ) {}

  createMessage(messageDto: MessageDto) {
    const message = this.privateMessagesRepository.create(messageDto);
    this.privateMessagesRepository.save(message);
    return 'This action adds a new privateConv';
  }

  async getConv(sender: UserEntity, requester: UserEntity) {
    const conv = await this.privateConvRepository.findOneBy([
      { user1: { id: sender.id }, user2: { id: requester.id } },
      { user1: { id: requester.id }, user2: { id: sender.id } },
    ]);
    if (conv) return conv;
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  createConv(sender: UserEntity, requester: UserEntity) {
    const ToSave = this.privateConvRepository.create({
      user1: sender,
      user2: requester,
    });

    return this.privateConvRepository.save(ToSave);
  }
  async getMessages(convUuid: string, offset: number) {
    const allMessages: { author: string; text: string }[] = [];
    const conv = await this.privateConvRepository.findOneBy({ uuid: convUuid });
    await this.privateMessagesRepository
      .find({
        order: {
          createdAt: 'DESC',
        },
        where: {
          conv: { id: conv.id },
        },
        take: 10,
        skip: offset,
      })
      .then((data) => {
        data.forEach((message) => {
          allMessages.unshift({
            author: message.author.nickname,
            text: message.text,
          });
        });
      });
    return allMessages;
  }

  async getAllConvs(id: number) {
    const convs = await this.privateConvRepository.find({
      where: [{ user1: { id: id } }, { user2: { id: id } }],
      order: {
        lastMessage: 'DESC',
      },
    });
    if (convs) return convs;
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async updateLastMessageDate(conv: PrivateConvEntity) {
    const convToUpdate = await this.privateConvRepository.findOneBy({
      uuid: conv.uuid,
    });
    convToUpdate.lastMessage = new Date();
    return await this.privateConvRepository.save(convToUpdate);
  }
}
