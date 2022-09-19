import { PartialType } from '@nestjs/mapped-types';
import { CreateOauthDto } from './create-oauth.dto';

export class UpdateOauthDto extends PartialType(CreateOauthDto) {}
