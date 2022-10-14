import { APP_FILTER, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as http from 'http';

// const httpServer = createServer();
// const io = new Server(httpServer, {});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  await app.init();
  //   http.createServer(app.getHttpAdapter().getInstance()).listen(3000);
  app.listen(3000);
  //   http.createServer(app.getHttpAdapter().getInstance()).listen(80);
}
bootstrap();
