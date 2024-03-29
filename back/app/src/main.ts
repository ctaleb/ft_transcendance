import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// const httpServer = createServer();
// const io = new Server(httpServer, {});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
  });
  //   app.enableCors({
  //     origin: /^(http:\/\/([^\.]*\.)?127.0.0.1:4000)$/i,
  //   });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  //   const httpServer = createServer();
  //   const io = new Server(httpServer, {
  //     path: '/api/socket.io/',
  //   });

  await app.init();
  // http.createServer(app.getHttpAdapter().getInstance()).listen(3000);
  app.listen(3000);
  // http.createServer(app.getHttpAdapter().getInstance()).listen(80);
}
bootstrap();
