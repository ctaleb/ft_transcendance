import { PartialType } from '@nestjs/mapped-types';
import { CreateFriendListDto } from './create-friend_list.dto';

export class DeleteFriendListDto extends PartialType(CreateFriendListDto) {}
