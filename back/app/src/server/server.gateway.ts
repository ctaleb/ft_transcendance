import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ServerService } from './server.service';
import { PrivateConvService } from '../private_conv/private_conv.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { Game } from './entities/server.entity';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

@WebSocketGateway(3500, {
  cors: {
    origin: '*',
  },
})
export class ServerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly serverService: ServerService,
    private readonly privateMessageService: PrivateConvService,
    private readonly userService: UserService,
  ) {}

  afterInit(server: Server) {
    this.serverService.server = server;
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    let hsToken;
    let hsNick;
    if (client.handshake) {
      hsToken = client.handshake.auth.token;
      hsNick = client.handshake.auth.user.nickname;
    }
    console.log(hsNick + ' trying to connect to socket');
    const user = this.serverService.userList.find(
      (element) => element.name === hsNick,
    );
    if (user && user.token === hsToken) {
      user.socket = client;
      console.log(user.name + ' rejoining game ' + user.status);
      if (user.status === 'ready') this.serverService.reconnect(user);
    } else {
      this.serverService.newUser(hsToken, hsNick, client);
    }
    console.log('Socket ' + client.id + ' successfully connected');
  }

  @SubscribeMessage('debugging')
  debug(@ConnectedSocket() client: Socket) {
    console.log('~~~~~~~~~~~ debugging ~~~~~~~~~~');
    console.log(this.serverService.userList.length);
    this.serverService.userList.forEach((element) => {
      console.log(element.name + ' - ' + element.socket.id);
    });
    console.log(this.serverService.games.length);
    this.serverService.games.forEach((element) => {
      console.log(element.room.name + ' - ' + element.room.status);
      console.log(element.client.name + ' _ ' + element.client.socket.id);
      console.log(element.host.name + ' _ ' + element.host.socket.id);
    });
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  }

  @SubscribeMessage('chatting')
  debugchat() {
    console.log('~~~~~~~~~~~ chat debugging ~~~~~~~~~~');

    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  }

  @SubscribeMessage('disco')
  disco(@ConnectedSocket() client: Socket) {
    let ingame = false;
    const player = this.serverService.userList.find(
      (element) => element.socket === client,
    );
    if (player) {
      if (
        this.serverService.playerQueue.find((element) => element === player)
      ) {
        this.serverService.playerQueue.splice(
          this.serverService.playerQueue.indexOf(player),
          1,
        );
        this.serverService.userList.splice(
          this.serverService.userList.indexOf(player),
          1,
        );
      } else {
        this.serverService.games.forEach((element) => {
          if (
            element.room.status === 'launching' /*||
            element.room.status === 'gameOver'*/
          )
            return;
          if (element.client === player) {
            element.room.status = 'clientForfeit';
            ingame = true;
          } else if (element.host === player) {
            element.room.status = 'hostForfeit';
            ingame = true;
          }
        });
        if (!ingame) {
          this.serverService.userList.splice(
            this.serverService.userList.indexOf(player),
            1,
          );
        }
      }
    }
    client.disconnect();
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Socket ' + client.id + ' successfully disconnected');
  }

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.serverService.create(
      createMessageDto,
      client.id,
      room,
    );

    this.server.to(room).emit('message', message);
    // client.to(room).emit('message', message);
    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll(@MessageBody('room') room: string) {
    return this.serverService.findAll(room);
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @MessageBody('room') room: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    client.join(room);
    return this.serverService.identify(name, client.id, room);
  }

  @SubscribeMessage('findAllUsers')
  findUsers(@MessageBody('room') room: string) {
    return this.serverService.findUsers(room);
  }

  gameLoop = (game: Game) => {
    // this.server.to(game.room.name).emit('ServerUpdate', game.gameState);
    game.host.socket.emit('ServerUpdate', game.gameState);
    game.client.socket.emit(
      'ServerUpdate',
      this.serverService.inverseState(game.gameState),
    );
    const loopTimer = setTimeout(() => {
      if (
        game.gameState.score.client >= game.room.options.scoreMax ||
        game.gameState.score.host >= game.room.options.scoreMax
      ) {
        clearTimeout(loopTimer);
        this.serverService.end_game(game);
        return;
      } else if (game.room.status === 'clientForfeit') {
        clearTimeout(loopTimer);
        this.serverService.forfeit_game(game.host, game.client, game);
        return;
      } else if (game.room.status === 'hostForfeit') {
        clearTimeout(loopTimer);
        this.serverService.forfeit_game(game.client, game.host, game);
        return;
      }
      this.serverService.loop(game);
      this.gameLoop(game);
    }, 10);
  };

  @SubscribeMessage('key')
  downLeft(
    @MessageBody('key') key: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    this.serverService.storeBarMove(client, key);
  }

  // Game Core
  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket) {
    const player = this.serverService.SocketToPlayer(client);
    if (!player || !(player.status === 'idle')) return;
    const game = this.serverService.joinQueue(client);
    if (game) {
      this.server.to(game.room.name).emit('gameConfirmation', game.room);
      setTimeout(() => {
        if (game.host.status === 'ready' && game.client.status === 'ready') {
          game.room.status = 'playing';
          game.room.hostName = game.host.name;
          game.room.clientName = game.client.name;
          this.server.to(game.room.name).emit('startGame', game.room);
          this.serverService.startRound(game.room);
          this.gameLoop(game);
        } else {
          if (game.host.status === 'ready') {
            game.host.status = 'inQueue';
            game.client.status = 'idle';
            game.client.socket.emit('gameConfirmationTimeout');
            this.serverService.playerQueue.push(game.host);
          } else if (game.client.status === 'ready') {
            game.client.status = 'inQueue';
            game.host.status = 'idle';
            game.host.socket.emit('gameConfirmationTimeout');
            this.serverService.playerQueue.push(game.client);
          } else {
            game.host.status = 'idle';
            game.client.status = 'idle';
            this.server.to(game.room.name).emit('gameConfirmationTimeout');
          }
          this.serverService.games.splice(
            this.serverService.games.indexOf(game),
            1,
          );
        }
      }, 5000);
    }
  }

  @SubscribeMessage('playerReady')
  playerReady(@ConnectedSocket() client: Socket) {
    const player = this.serverService.userList.find(
      (element) => element.socket === client,
    );
    if (player) player.status = 'ready';
  }

  @SubscribeMessage('playerNotReady')
  playerNotReady(@ConnectedSocket() client: Socket) {
    const player = this.serverService.userList.find(
      (element) => element.socket === client,
    );
    if (player) player.status = 'idle';
  }

  //Private conv version Lolo
  @SubscribeMessage('deliverMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody('message') messageToDeliver: string,
    @MessageBody('friendNickname') friendNickname: string,
  ): Promise<void> {
    const receiver = this.serverService.userList.find(
      (element) => element.name === friendNickname,
    );
    if (receiver) {
      this.server.to(receiver.socket.id).emit('Message to the client', {
        message: messageToDeliver,
      });
    }
    //Si non, creer la conv, si oui, passer sous les comms
    //entrer les deux users en bdd pour creer la conv
    const getAuthor = this.serverService.SocketToPlayer(client);
    const author: UserEntity = await this.userService.getUserByNickname(
      getAuthor.name,
    );
    const requester: UserEntity = await this.userService.getUserByNickname(
      receiver.name,
    );
    const conv = await this.privateMessageService
      .getConv(author, requester)
      .catch(async () => {
        return await this.privateMessageService.createConv(author, requester);
      });
    //console.log(conv);
    this.privateMessageService.createMessage({
      author: author,
      text: messageToDeliver,
    });
  }
}
