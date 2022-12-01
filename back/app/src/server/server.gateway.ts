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
import { Game, GameOptions, IPower } from './entities/server.entity';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { NamingStrategyNotFoundError } from 'typeorm';

@WebSocketGateway(3500, {
  cors: {
    origin: '*',
  },
})
export class ServerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
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
    let hsToken: string;
    let hsNick: string;
    console.log('%%%');
    if (client.handshake) {
      hsToken = client.handshake.auth.token;
      hsNick = client.handshake.auth.user.nickname;
    }
    const user = this.serverService.userList.find((element) => element.name === hsNick);
    if (user && user.token === hsToken) {
      user.socket = client;
      if (user.gameData.status === 'ready') this.serverService.reconnect(user);
    } else {
      this.serverService.newUser(hsToken, hsNick, client);
    }
    console.log('Socket ' + client.id + ' successfully connected');
    // New stuff
    this.serverService.joinAllChannels(client, client.handshake.auth.user.id);
  }

  @SubscribeMessage('debugging')
  debug(@ConnectedSocket() client: Socket) {
    console.log('~~~~~~~~~~~ queue ~~~~~~~~~~');
    console.log(this.serverService.playerQueue.length);
    this.serverService.playerQueue.forEach((element) => {
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
    console.log('~~~~~~~~~~~ users + games ~~~~~~~~~~');
    console.log(this.serverService.userList.length);
    this.serverService.userList.forEach((element) => {
      console.log(element.name + ' - ' + element.socket?.id);
    });
    console.log(this.serverService.games.length);
    this.serverService.games.forEach((element) => {
      console.log(element.room.name + ' - ' + element.room.status);
      console.log(element.client.name + ' _ ' + element.client.socket.id);
      console.log(element.host.name + ' _ ' + element.host.socket.id);
    });
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  }

  @SubscribeMessage('disco')
  disco(@ConnectedSocket() client: Socket) {
    let ingame = false;
    const player = this.serverService.userList.find((element) => element.socket === client);
    if (player) {
      if (this.serverService.playerQueue.find((element) => element === player)) {
        this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(player), 1);
        this.serverService.userList.splice(this.serverService.userList.indexOf(player), 1);
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
        // if (!ingame) {
        this.serverService.userList.splice(this.serverService.userList.indexOf(player), 1);
        // }
      }
    }
    client.disconnect();
  }

  @SubscribeMessage('watchPath')
  switchPath(@ConnectedSocket() client: Socket) {
    let ingame = false;
    const player = this.serverService.userList.find((element) => element.socket === client);
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
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Socket ' + client.id + ' successfully disconnected');
  }

  @SubscribeMessage('createMessage')
  async create(@MessageBody() createMessageDto: CreateMessageDto, @MessageBody('room') room: string, @ConnectedSocket() client: Socket) {
    const message = await this.serverService.create(createMessageDto, client.id, room);

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
    game.client.socket.emit('ServerUpdate', this.serverService.inverseState(game.gameState, game));
    game.host.socket.emit('ServerUpdate', this.serverService.sendState(game.gameState, game));
    this.server.to(game.theatre.name).emit('ServerUpdate', this.serverService.sendState(game.gameState, game));
    // this.server.to(game.room.name).emit('gameConfirmation', game.room);

    const loopTimer = setTimeout(() => {
      if (game.gameState.score.client >= game.room.options.scoreMax || game.gameState.score.host >= game.room.options.scoreMax) {
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
  recieveKey(
    @MessageBody('key') key: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    console.log('recieved ' + key + ' from ' + client.id);
    // const player = this.serverService.SocketToPlayer(client);
    // if (player && player.gameData.status != 'idle')
    this.serverService.storeInput(client, key);
  }

  // Game Core
  //@body() powerString as additional arg
  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket, @MessageBody('power') power: string) {
    const player = this.serverService.SocketToPlayer(client);
    if (!player || !(player.gameData.status === 'idle')) return;
    const game = this.serverService.joinQueue(client, power);
    if (game) {
      console.log(game.host.socket.id + ' vs ' + game.client.socket.id);
      this.server.to(game.room.name).emit('gameConfirmation', game.room);
      //   console.log(game.client.socket.id);
      //   console.log(game.host.socket.id);
      setTimeout(() => {
        if (game.host.gameData.status === 'ready' && game.client.gameData.status === 'ready') {
          game.room.status = 'playing';
          game.room.hostName = game.host.name;
          game.room.clientName = game.client.name;
          this.server.to(game.room.name).emit('startGame', game.room);
          this.serverService.startRound(game.room);
          this.gameLoop(game);
          this.serverService.updateStatus(game.host.id, 'inGame');
          this.serverService.updateStatus(game.client.id, 'inGame');
        } else {
          if (game.host.gameData.status === 'ready') {
            game.host.gameData.status = 'inQueue';
            this.serverService.updateStatus(game.host.id, 'inQueue');
            game.client.gameData.status = 'idle';
            this.serverService.updateStatus(game.client.id, 'online');
            game.client.socket.emit('gameConfirmationTimeout');
            this.serverService.playerQueue.push(game.host);
          } else if (game.client.gameData.status === 'ready') {
            game.client.gameData.status = 'inQueue';
            this.serverService.updateStatus(game.client.id, 'inQueue');
            game.host.gameData.status = 'idle';
            this.serverService.updateStatus(game.host.id, 'online');
            game.host.socket.emit('gameConfirmationTimeout');
            this.serverService.playerQueue.push(game.client);
          } else {
            game.host.gameData.status = 'idle';
            this.serverService.updateStatus(game.host.id, 'online');
            game.client.gameData.status = 'idle';
            this.serverService.updateStatus(game.client.id, 'online');
            this.server.to(game.room.name).emit('gameConfirmationTimeout');
          }
          this.serverService.games.splice(this.serverService.games.indexOf(game), 1);
        }
      }, 5000);
    }
  }

  @SubscribeMessage('playerReady')
  playerReady(@ConnectedSocket() client: Socket) {
    const player = this.serverService.userList.find((element) => element.socket === client);
    if (player) player.gameData.status = 'ready';
  }

  @SubscribeMessage('playerNotReady')
  playerNotReady(@ConnectedSocket() client: Socket) {
    const player = this.serverService.userList.find((element) => element.socket === client);
    if (player) player.gameData.status = 'idle';
  }

  //spectate
  @SubscribeMessage('spectate')
  spectate(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    let response = 'na';
    this.serverService.games.forEach((element) => {
      console.log(element.host.name);
      console.log(element.client.name);
      console.log(friend);
      if (element.client.name == friend || element.host.name == friend) response = 'ingame';
    });
    return response;
  }

  @SubscribeMessage('readySpectate')
  readySpectate(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    const game = this.serverService.games.find((element) => element.client.name === friend || element.host.name === friend);
    if (game) {
      client.emit('spectating', game.room);
      client.join(game.theatre.name);
      game.theatre.viewers.push(client);
    }
  }

  //customInvite
  @SubscribeMessage('customInvite')
  customInvite(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    let response = 'failure';
    let game: Game;
    const inviter = this.serverService.userList.find((element) => element.socket === client);
    const usr = this.serverService.userList.find((element) => element.name === friend);
    if (usr && usr.gameData.status === 'idle') {
      response = 'accepted';
      game = this.serverService.newGame(usr, inviter);
      game.room.name = 'game-' + game.host.name + '-' + game.client.name;
      game.theatre.name = 'spec-' + game.host.name + '-' + game.client.name;
      usr.gameData.status = 'inLobby';
      this.serverService.updateStatus(usr.id, 'inLobby');
      inviter.gameData.status = 'inLobby';
      this.serverService.updateStatus(inviter.id, 'inLobby');
      game.host.socket.join(game.room.name);
      usr.socket.emit('invitation', inviter.name);
      this.serverService.games.push(game);
    } else {
      client.emit('inviteFailure');
    }
    return response;
  }

  //inviter logic
  @SubscribeMessage('settingsInviter')
  settingsInviter(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    client.emit('customInviter', friend);
  }
  @SubscribeMessage('readyInviter')
  readyInviter(@MessageBody('gameOpts') gameOpts: GameOptions, @MessageBody('power') power: string, @ConnectedSocket() client: Socket) {
    console.log('inviter is ready');
    const usr = this.serverService.SocketToPlayer(client);
    if (!usr) return;
    const game = this.serverService.games.find((element) => element.host === usr);
    if (!game) return;
    if (game.room.options.powers) usr.gameData.power = new IPower(power);
    usr.gameData.status = 'ready';
    game.room.options = gameOpts;
    if (game.client.gameData.status === 'ready') {
      this.launchCustomGame(game);
    }
  }

  //invitee logic
  @SubscribeMessage('declineCustom')
  declineCustom(@ConnectedSocket() client: Socket) {
    const usr = this.serverService.SocketToPlayer(client);
    const game = this.serverService.games.find((element) => element.client === usr);
    if (game) {
      game.host.gameData.status = 'idle';
      this.serverService.updateStatus(game.host.id, 'online');
      game.host.socket.leave(game.room.name);
      game.client.gameData.status = 'idle';
      this.serverService.updateStatus(game.client.id, 'online');
      game.host.socket.emit('foreverAlone');
      this.serverService.games.splice(this.serverService.games.indexOf(game), 1);
    }
  }
  @SubscribeMessage('settingsInvitee')
  settingsInvitee(@ConnectedSocket() client: Socket) {
    const usr = this.serverService.SocketToPlayer(client);
    const game = this.serverService.games.find((element) => element.client === usr);
    if (game) {
      game.client.socket.join(game.room.name);
      client.emit('customInvitee', game.host.name);
    } else {
      usr.gameData.status = 'idle';
      this.serverService.updateStatus(usr.id, 'online');
    }
  }
  @SubscribeMessage('readyInvitee')
  readyInvitee(@MessageBody('power') power: string, @ConnectedSocket() client: Socket) {
    console.log('invitee is ready');
    const usr = this.serverService.SocketToPlayer(client);
    if (!usr) return;
    const game = this.serverService.games.find((element) => element.client === usr);
    if (!game) return;
    if (game.room.options.powers) usr.gameData.power = new IPower(power);
    usr.gameData.status = 'ready';
    if (game.host.gameData.status === 'ready') {
      this.launchCustomGame(game);
    }
  }

  launchCustomGame(game: Game) {
    this.serverService.initGameValues(game);
    if (game.room.options.powers) {
      this.serverService.initPower(game.client, game.gameState, game.gameState.clientBar, game.gameState.hostBar);
      this.serverService.initPower(game.host, game.gameState, game.gameState.hostBar, game.gameState.clientBar);
    }
    game.room.status = 'playing';
    game.room.hostName = game.host.name;
    game.room.clientName = game.client.name;
    this.serverService.updateStatus(game.host.id, 'inGame');
    this.serverService.updateStatus(game.client.id, 'inGame');
    this.server.to(game.room.name).emit('startGame', game.room);
    this.serverService.startRound(game.room);
    this.gameLoop(game);
  }

  //Private conv version Lolo
  @SubscribeMessage('deliverMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody('message') messageToDeliver: string,
    @MessageBody('friendNickname') friendNickname: string,
  ) {
    let requester: UserEntity;
    const getAuthor = this.serverService.SocketToPlayer(client);
    const receiver = this.serverService.userList.find((element) => element.name === friendNickname);
    if (receiver) {
      requester = await this.userService.getUserByNickname(receiver.name);
    } else {
      requester = await this.userService.getUserByNickname(friendNickname);
    }

    const author: UserEntity = await this.userService.getUserByNickname(getAuthor.name);

    const conv = await this.privateMessageService.getConv(author.id, requester.id).catch(async () => {
      return await this.privateMessageService.createConv(author.id, requester.id);
    });
    await this.privateMessageService.updateLastMessageDate(conv);
    if (receiver)
      this.server.to(receiver.socket.id).emit('Update conv list', {
        conv: conv,
      }); //need to emit to both users, to signal them than the conv must be push to top of the list
    this.server.to(client.id).emit('Update conv list', {
      conv: conv,
    });
    const message = await this.privateMessageService.createMessage({
      conv: conv,
      author: author,
      text: messageToDeliver,
    });
    if (receiver)
      this.server.to(receiver.socket.id).emit('Message to the client', {
        author: getAuthor.name,
        text: messageToDeliver,
        date: message.date,
      });
    return { author: getAuthor.name, text: messageToDeliver, date: message.date };
  }

  // Channel messages by the GOAT
  @SubscribeMessage('sendChannelMessage')
  async sendChannelMessage(@ConnectedSocket() client: Socket, @MessageBody('channelId') channelId: number, @MessageBody('content') content: string) {
    return await this.serverService.sendChannelMessage(channelId, content, client.handshake.auth.user.id);
  }

  @SubscribeMessage('friendToConv')
  friendToConv(@ConnectedSocket() client: Socket, @MessageBody('target') nickname: string) {
    this.server.to(this.serverService.PlayerToSocket(nickname).id).emit('friendTooConv', client.handshake.auth.user.id);
  }

  @SubscribeMessage('updateChannelMembers')
  async updateChannelMembers(@ConnectedSocket() client: Socket, @MessageBody('id') channelId: number) {
    await this.serverService.updateChannelMembers(channelId, client);
  }

  @SubscribeMessage('joinChannelRoom')
  async joinChannelRoom(@ConnectedSocket() client: Socket, @MessageBody('id') channelId: number) {
    await this.serverService.joinChannelRoom(client, channelId);
    // update channel members
  }

  @SubscribeMessage('leaveChannelRoom')
  async leaveChannelRoom(@ConnectedSocket() client: Socket, @MessageBody('id') channelId: number) {
    await this.serverService.leaveChannelRoom(client, channelId);
  }

  @SubscribeMessage('channelUpdated')
  async channelUpdated(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('name') name: string, @MessageBody('type') type: string) {
    await this.serverService.updateChannel(client, id, name, type);
  }

  @SubscribeMessage('privateChannelInvite')
  async privateChannelInvite(@ConnectedSocket() client: Socket, @MessageBody('nickname') nickname: string, @MessageBody('channel') channel: string) {
    this.server.to(this.serverService.PlayerToSocket(nickname).id).emit('incomingChannelInvitation', channel);
  }
}
