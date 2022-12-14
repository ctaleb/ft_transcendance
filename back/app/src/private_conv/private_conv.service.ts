import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { PrivateMessageEntity } from 'src/private_conv/entities/privateMessage.entity';
import { UserEntity } from 'src/user/user.entity';
import { MessageDto } from './dto/MessageDto';
import { PrivateConvEntity } from './entities/private_conv.entity';

@Injectable()
export class PrivateConvService {
  constructor() {}

  async createMessage(messageDto: MessageDto): Promise<PrivateMessageEntity> {
    const message = PrivateMessageEntity.create(messageDto as any);
    return await PrivateMessageEntity.save(message);
  }

  /**
   * Finds a conversation where user1 or user2 is equals to the first parameter `user`.
   * @param user The user
   * @param id The uuid of the conversation to find.
   * @returns
   */
  async getJoinedConv(user: number, id: number): Promise<PrivateConvEntity> {
    const conv = await PrivateConvEntity.findOneBy({ id });
    if (conv.user1.id != user && conv.user2.id != user) {
      return Promise.reject('Conversation not found');
    }
    return conv;
  }

  async getConv(user1Id: number, user2Id: number): Promise<PrivateConvEntity> {
    const conv = await PrivateConvEntity.findOne({
      where: [
        { user1: { id: user1Id }, user2: { id: user2Id } },
        { user1: { id: user2Id }, user2: { id: user1Id } },
      ],
    });
    if (conv) return conv;
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  async createConv(user1Id: number, user2Id: number): Promise<PrivateConvEntity> {
    if (user1Id === user2Id)
      throw new BadRequestException("Can't create conversation with yourself");
    
    const ToSave = PrivateConvEntity.create({
      user1: { id: user1Id },
      user2: { id: user2Id },
    });

    return await PrivateConvEntity.save(ToSave);
  }

  async getAllConvs(id: number) {
    const result = [];
    const convs = await PrivateConvEntity.find({
      where: [{ user1: { id: id } }, { user2: { id: id } }],
      order: {
        lastMessage: 'DESC',
      },
    });
    convs.forEach((conv) => {
      result.push(instanceToPlain(conv, { groups: [id === conv.user1.id ? 'user2' : ''] }));
    });
    if (result) return result;
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
