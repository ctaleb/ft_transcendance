import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { AuthenticationProvider } from '../authentication/authentication.provider';

@EventSubscriber()
export class ChannelSubscriber
  implements EntitySubscriberInterface<ChannelEntity>
{
  listenTo() {
    return ChannelEntity;
  }

  async beforeInsert({ entity }: InsertEvent<ChannelEntity>): Promise<void> {
    if (entity.password) {
      entity.password = await AuthenticationProvider.generateHash(
        entity.password,
      );
    } else entity.password = null;
  }

  async beforeUpdate({
    entity,
    databaseEntity,
  }: UpdateEvent<ChannelEntity>): Promise<void> {
    if (entity.password) {
      const password = await AuthenticationProvider.generateHash(
        entity.password,
      );

      if (password !== databaseEntity?.password) {
        entity.password = password;
      }
    } else entity.password = null;
  }
}
