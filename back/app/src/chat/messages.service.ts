import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { GameState, IPoint } from '../game-state/entities/game-state.entity';

@Injectable()
export class MessagesService {
  messages: Message[] = [
    {
      name: 'John Doe',
      message: 'Hello World!',
    },
    {
      name: 'Jane Doe',
      message: 'Hello John!',
    },
  ];
  StartPoint: IPoint = {
    x: 200,
    y: 200,
  };
  StartSpeed: IPoint = {
    x: 2.6,
    y: 2,
  };
  gameState: GameState = {
    ball: this.StartPoint,
    speed: this.StartSpeed,
  };

  clientToUser = {};

  identify(name: string, clientId: string) {
    this.clientToUser[clientId] = name;

    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string) {
    return this.clientToUser[clientId];
  }

  create(createMessageDto: CreateMessageDto, clientId: string) {
    const message = {
      name: this.clientToUser[clientId],
      message: createMessageDto.message,
    };
    this.messages.push(message);

    return message;
  }

  findAll() {
    return this.messages;
  }

  update() {
    return this.gameState.ball;
    // return `This action updates a #${id} gameState`;
  }

  loop() {
    if (this.gameState.ball.x - 16 <= 0) {
      this.gameState.speed.x *= -1;
      this.gameState.ball.x = 0 + 16;
      //   ball.rotation = 0;
    }
    if (this.gameState.ball.x + 16 > 500) {
      this.gameState.speed.x *= -1;
      //   ball.rotation = 0;
      this.gameState.ball.x = 500 - 16;
    }
    if (this.gameState.speed.y > 0) {
      if (
        this.gameState.ball.y > 500 - 15 - 16 ||
        this.gameState.ball.y <= 16 + 15
      ) {
        // if (
        //   this.gameState.ball.x > topBar.x &&
        //   this.gameState.ball.x < topBar.x + barWidth
        // ) {
        this.gameState.speed.y *= 1.1;
        this.gameState.speed.y *= -1;
        //   ball.rotation = (20 * this.gameState.speed.y) * barMoving;
        //   counter.value++;
        // }
      }
    } else if (this.gameState.speed.y < 0) {
      if (
        this.gameState.ball.y > 500 - 15 - 16 ||
        this.gameState.ball.y <= 16 + 15
      ) {
        // if (
        //   this.gameState.ball.x > bottomBar.x &&
        //   this.gameState.ball.x < bottomBar.x + barWidth
        // ) {
        this.gameState.speed.y *= 1.1;
        this.gameState.speed.y *= -1;
        //   ball.rotation = 20 * this.gameState.speed.y * barMoving;
        //   counter.value++;
      }
    }
    this.gameState.ball.x += this.gameState.speed.x;
    this.gameState.ball.y -= this.gameState.speed.y;
    // this.loop();
  }
  //     if (
  //       (this.gameState.speed.x > 0 && ball.rotation > 0) ||
  //       (this.gameState.speed.x < 0 && ball.rotation < 0)
  //     )
  //       ball.rotation *= -1;
  //     this.gameState.ball.x += ball.rotation / 10;
  //     this.gameState.ball.y -= this.gameState.speed.y;
  //     ball.rotation *= 0.99;
  //   }
}
