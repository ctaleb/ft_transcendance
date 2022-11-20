import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrivateMessageEntity } from 'src/private_conv/entities/privateMessage.entity';
import { UserEntity } from 'src/user/user.entity';
import { MessageDto } from './dto/MessageDto';
import { PrivateConvEntity } from './entities/private_conv.entity';

@Injectable()
export class PrivateConvService {
  constructor() {}

  async getMessages(conv: PrivateConvEntity, offset: number): Promise<PrivateMessageEntity[]> {
    return await PrivateMessageEntity.find({
      order: {
        createdAt: 'DESC',
      },
      where: {
        conv: { id: conv.id },
      },
      take: 10,
      skip: offset,
    });
  }

  async createMessage(messageDto: MessageDto): Promise<PrivateMessageEntity> {
    const message = PrivateMessageEntity.create(messageDto as any);
    return await PrivateMessageEntity.save(message);
  }

  /**
   * Finds a conversation where user1 or user2 is equals to the first parameter `user`.
   * @param user The user
   * @param convUuid The uuid of the conversation to find.
   * @returns
   */
  async getJoinedConv(user: number, convUuid: string): Promise<PrivateConvEntity> {
    const conv = await PrivateConvEntity.findOneBy({ uuid: convUuid });
    if (conv.user1.id != user && conv.user2.id != user) {
      return Promise.reject('Conversation not found');
    }
    return conv;
  }

  async getConv(sender: UserEntity, requester: UserEntity): Promise<PrivateConvEntity> {
    const conv = await PrivateConvEntity.findOne({
      where: [
        { user1: { id: sender.id }, user2: { id: requester.id } },
        { user1: { id: requester.id }, user2: { id: sender.id } },
      ],
    });
    if (conv) return conv;
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async createConv(sender: UserEntity, requester: UserEntity): Promise<PrivateConvEntity> {
    const ToSave = PrivateConvEntity.create({
      user1: sender,
      user2: requester,
    });

    return await PrivateConvEntity.save(ToSave);
  }

  async getAllConvs(id: number) {
    const convs = await PrivateConvEntity.find({
      where: [{ user1: { id: id } }, { user2: { id: id } }],
      order: {
        lastMessage: 'DESC',
      },
    });
    if (convs) return convs;
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async updateLastMessageDate(conv: PrivateConvEntity) {
    const convToUpdate = await PrivateConvEntity.findOneBy({
      uuid: conv.uuid,
    });
    convToUpdate.lastMessage = new Date();
    return await PrivateConvEntity.save(convToUpdate);
  }
}
