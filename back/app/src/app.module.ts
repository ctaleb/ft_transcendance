import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ServeStaticModule} from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forRoot(configService.getTypeOrmConfig()), ServeStaticModule.forRoot({
    rootPath: join(__dirname, '../../..', 'front/app/dist'),
  }), ],
  controllers: [],
  providers: [],
})
export class AppModule {}
