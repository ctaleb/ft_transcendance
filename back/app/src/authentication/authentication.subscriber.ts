import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { AuthenticationProvider } from './authentication.provider';

@EventSubscriber()
export class AuthenticationSubscriber
  implements EntitySubscriberInterface<UserEntity>
{
  listenTo() {
    return UserEntity;
  }

  async beforeInsert({ entity }: InsertEvent<UserEntity>): Promise<void> {
    if (entity.password) {
      entity.password = await AuthenticationProvider.generateHash(
        entity.password,
      );
    }
  }

  async beforeUpdate({
    entity,
    databaseEntity,
  }: UpdateEvent<UserEntity>): Promise<void> {
    if (entity.password) {
      const password = await AuthenticationProvider.generateHash(
        entity.password,
      );

      if (password !== databaseEntity?.password) {
        entity.password = password;
      }
    }
  }
}
