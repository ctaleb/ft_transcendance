import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ServeStaticModule} from '@nestjs/serve-static'; // New
import { join } from 'path'; // New

@Module({
  imports: [UsersModule, ServeStaticModule.forRoot({
    rootPath: join(__dirname, '../../..', 'front/app/dist'),
  }), ],
  controllers: [],
  providers: [],
})
export class AppModule {}
