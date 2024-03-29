import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'src/chat/chat.service';
import { ChannelMemberEntity, ChannelRole } from 'src/chat/entities/channel_member.entity';
import { FriendshipService } from 'src/friendship/friendship.service';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { PrivateConvService } from '../private_conv/private_conv.service';
import { Game, GameOptions, IPower } from './entities/server.entity';
import { ServerService } from './server.service';

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
    private readonly friendshipService: FriendshipService,
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.serverService.server = server;
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    let hsToken: string;
    let hsNick: string;
    if (client.handshake) {
      hsToken = client.handshake.auth.token;
      hsNick = client.handshake.auth.user.nickname;
    }
    const user = this.serverService.userList.find((element) => element.name === hsNick);
    if (user && user.socket?.connected) {
      client.emit('noMultiClient');
      client.disconnect();
      const toDel = this.serverService.userList.find((element) => element.name === hsNick && element.socket === undefined);
      if (toDel) this.serverService.userList.splice(this.serverService.userList.indexOf(toDel), 1);
      return;
    }
    if (user && user.token === hsToken) {
      user.socket = client;
      this.serverService.reconnect(user);
    } else {
      this.serverService.newUser(hsToken, hsNick, client);
    }
    // New stuff
    this.serverService.joinAllChannels(client, client.handshake.auth.user.id);
  }

  @SubscribeMessage('disco')
  disco(@ConnectedSocket() client: Socket) {
    if (client) {
      const player = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
      if (player) {
        if (this.serverService.playerQueue.find((element) => element.id === player.id)) {
          this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(player), 1);
          //   this.serverService.userList.splice(this.serverService.userList.indexOf(player), 1);
          //   this.serverService.updateStatus(player.id, 'offline');
        } else if (
          player.gameData.status === 'inCustomLobby' ||
          player.gameData.status === 'hostingCustomLobby' ||
          player.gameData.status === 'ready' ||
          player.gameData.status === 'invited'
        ) {
          const game = this.serverService.games.find((gme) => gme.host.socket.id === client.id || gme.client.socket.id === client.id);
          if (game) {
            if (game.client.socket.id === client.id) this.serverService.stopCustom(game.host, game.client, game);
            else this.serverService.stopCustom(game.client, game.host, game);
          }
        } else {
          this.serverService.games.forEach((element) => {
            if (element.room.status === 'launching') return;
            if (element.client.id === player.id) {
              element.room.status = 'clientForfeit';
            } else if (element.host.id === player.id) {
              element.room.status = 'hostForfeit';
            }
          });
        }
        // this.serverService.updateStatus(player.id, 'offline');
        // this.serverService.userList.splice(this.serverService.userList.indexOf(player), 1);
      }
      client.disconnect();
      //   this.serverService.userList.forEach((element) => {
      //     if (element.socket && element.socket.id === client.id) this.serverService.userList.splice(this.serverService.userList.indexOf(element), 1);
      //   });
    }
  }

  @SubscribeMessage('watchPath')
  switchPath(@ConnectedSocket() client: Socket, @MessageBody('oldValue') oldValue: string, @MessageBody('newValue') newValue: string) {
    if (!oldValue || !newValue) return;
    const player = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
    if (!player) return;
    this.serverService.games.forEach((element) => {
      if (element.room.status === 'launching') {
        if (oldValue == '/game') {
          if (element.client.id === player.id) {
            if (
              player.gameData.status === 'inCustomLobby' ||
              player.gameData.status === 'hostingCustomLobby' ||
              player.gameData.status === 'ready' ||
              player.gameData.status === 'invited'
            ) {
              this.serverService.stopCustom(element.host, element.client, element);
            } else if (player.gameData.status === 'readyQ') {
              player.gameData.status = 'idle';
              this.serverService.updateStatus(player.id, 'online');
            }
          } else if (element.host.id === player.id) {
            if (player.gameData.status === 'inCustomLobby' || player.gameData.status === 'hostingCustomLobby' || player.gameData.status === 'ready') {
              this.serverService.stopCustom(element.client, element.host, element);
            } else if (player.gameData.status === 'readyQ') {
              player.gameData.status = 'idle';
              this.serverService.updateStatus(player.id, 'online');
            }
          }
        }
        return;
      }
      if (element.client.id === player.id) {
        element.room.status = 'clientForfeit';
      } else if (element.host.id === player.id) {
        element.room.status = 'hostForfeit';
      }
      if (oldValue.indexOf('/profile') == -1 && oldValue != '/chat') {
        const theatre = element.theatre.name;
        element.theatre.viewers.forEach((element) => {
          if (element.id === client.id) {
            const spectator = this.serverService.userList.find((usr) => usr.socket.id === element.id);
            if (spectator) {
              spectator.gameData.status = 'idle';
              this.serverService.updateStatus(spectator.id, 'online');
            }
            element.leave(theatre);
          }
        });
      }
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const removedUsers = [];
    this.serverService.userList = this.serverService.userList.filter((element) => {
      if ((element.socket && element.socket.id != client.id) || !element.socket) {
        return true;
      }
      removedUsers.push(element);
      return false;
    });
    removedUsers.forEach((element) => this.serverService.updateStatus(element.id, 'offline'));
  }

  gameLoop = (game: Game) => {
    game.host.socket.emit('ServerUpdate', this.serverService.sendState(game.gameState, game));
    game.client.socket.emit('ServerUpdate', this.serverService.inverseState(game.gameState, game));
    this.server.to(game.theatre.name).emit('ServerUpdate', this.serverService.sendState(game.gameState, game));

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

  @SubscribeMessage('newNick')
  changeNick(@MessageBody('oldNick') oldNick: string, @MessageBody('newNick') newNick: string, @ConnectedSocket() client: Socket) {
    const player = this.serverService.SocketToPlayer(client);
    if (!player || player.name != oldNick) return;
    player.name = newNick;
  }

  @SubscribeMessage('key')
  recieveKey(
    @MessageBody('key') key: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    if (!key) return;
    this.serverService.storeInput(client, key);
  }

  // Game Core
  @SubscribeMessage('joinQueue')
  joinQueue(@ConnectedSocket() client: Socket, @MessageBody('power') power: string) {
    if (!power) return;
    const player = this.serverService.SocketToPlayer(client);
    if (!player || !(player.gameData.status === 'idle')) return;
    const game = this.serverService.joinQueue(client, power);
    if (game) {
      this.server.to(game.room.name).emit('gameConfirmation', game.room);
      setTimeout(async () => {
        if (game.host.gameData.status === 'readyQ' && game.client.gameData.status === 'readyQ') {
          game.room.status = 'playing';
          game.room.hostName = game.host.name;
          game.room.clientName = game.client.name;
          game.room.opponent = instanceToPlain(await this.userService.getUserByNickname(game.client.name));
          game.room.host = instanceToPlain(await this.userService.getUserByNickname(game.host.name));
          game.room.start = new Date();
          game.host.gameData.status = 'playing';
          game.client.gameData.status = 'playing';
          game.host.socket.emit('startGame', game.room);
          game.client.socket.emit('startGame', game.room);
          // this.server.to(game.room.name).emit('startGame', game.room);
          this.serverService.updateStatus(game.host.id, 'inGame');
          this.serverService.updateStatus(game.client.id, 'inGame');
          this.gameLoop(game);
        } else {
          if (game.host.gameData.status === 'readyQ') {
            game.host.gameData.status = 'inQueue';
            this.serverService.updateStatus(game.host.id, 'inQueue');
            game.client.gameData.status = 'idle';
            this.serverService.updateStatus(game.client.id, 'online');
            this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(game.client), 1);
            game.client.socket.emit('gameConfirmationTimeout');
            this.serverService.playerQueue.push(game.host);
          } else if (game.client.gameData.status === 'readyQ') {
            game.client.gameData.status = 'inQueue';
            this.serverService.updateStatus(game.client.id, 'inQueue');
            game.host.gameData.status = 'idle';
            this.serverService.updateStatus(game.host.id, 'online');
            this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(game.host), 1);
            game.host.socket.emit('gameConfirmationTimeout');
            this.serverService.playerQueue.push(game.client);
          } else {
            game.host.gameData.status = 'idle';
            this.serverService.updateStatus(game.host.id, 'online');
            this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(game.host), 1);
            game.client.gameData.status = 'idle';
            this.serverService.updateStatus(game.client.id, 'online');
            this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(game.client), 1);
            this.server.to(game.room.name).emit('gameConfirmationTimeout');
          }
          this.serverService.games.splice(this.serverService.games.indexOf(game), 1);
        }
      }, 5000);
    }
  }
  @SubscribeMessage('leaveQueue')
  leaveQueue(@ConnectedSocket() client: Socket) {
    const player = this.serverService.SocketToPlayer(client);
    if (!player || player.gameData.status != 'inQueue') return;
    player.gameData.status = 'idle';
    if (this.serverService.playerQueue.find((element) => element === player))
      this.serverService.playerQueue.splice(this.serverService.playerQueue.indexOf(player), 1);
    this.serverService.updateStatus(player.id, 'online');
  }

  @SubscribeMessage('playerReady')
  playerReady(@ConnectedSocket() client: Socket) {
    const player = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
    if (player && player.gameData.status === 'inLobby') player.gameData.status = 'readyQ';
  }

  @SubscribeMessage('playerNotReady')
  playerNotReady(@ConnectedSocket() client: Socket) {
    const player = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
    if (player && player.gameData.status === 'inLobby') player.gameData.status = 'idle';
  }

  //spectate
  @SubscribeMessage('spectate')
  spectate(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    let response = 'na';
    if (!friend) return response;
    const player = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
    if (!player || player.gameData.status != 'idle') return response;
    this.serverService.games.forEach((element) => {
      if (element.client.name == friend || element.host.name == friend) response = 'inGame';
    });
    return response;
  }

  @SubscribeMessage('readySpectate')
  async readySpectate(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    if (!friend) return;
    const player = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
    const game = this.serverService.games.find((element) => element.client.name === friend || element.host.name === friend);
    if (game) {
      if (player && player.gameData.status === 'idle') {
        player.gameData.status = 'spectating';
        this.serverService.updateStatus(player.id, 'spectating');
        client.emit('spectating', game.room);
        client.join(game.theatre.name);
        game.theatre.viewers.push(client);
      }
      //   game.room.opponent = instanceToPlain(await this.userService.getUserByNickname(game.client.name));
      //   game.room.host = instanceToPlain(await this.userService.getUserByNickname(game.host.name));
    }
  }

  //customInvite
  @SubscribeMessage('customInvite')
  customInvite(@MessageBody('friend') friend: string, @ConnectedSocket() client: Socket) {
    if (!friend) return;
    let response = 'failure';
    let game: Game;
    const inviter = this.serverService.userList.find((element) => element.socket && element.socket.id === client.id);
    if (!inviter || inviter.gameData.status != 'idle') return response;
    const usr = this.serverService.userList.find((element) => element.name === friend);
    if (!usr) return response;
    if (usr && usr.gameData.status === 'idle') {
      response = 'accepted';
      game = this.serverService.newGame(usr, inviter);
      game.room.name = 'game-' + game.host.name + '-' + game.client.name;
      game.theatre.name = 'spec-' + game.host.name + '-' + game.client.name;
      usr.gameData.status = 'invited';
      this.serverService.updateStatus(usr.id, 'invited');
      inviter.gameData.status = 'hostingCustomLobby';
      this.serverService.updateStatus(inviter.id, 'hostingCustomLobby');
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
    if (!friend) return;
    const player = this.serverService.SocketToPlayer(client);
    if (!player || player.gameData.status != 'hostingCustomLobby') return;
    client.emit('customInviter', friend);
  }
  @SubscribeMessage('readyInviter')
  readyInviter(@MessageBody('gameOpts') gameOpts: GameOptions, @MessageBody('power') power: string, @ConnectedSocket() client: Socket) {
    if (!gameOpts || !power) return;
    const usr = this.serverService.SocketToPlayer(client);
    if (!usr || usr.gameData.status != 'hostingCustomLobby') return;
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
    if (!usr) return;
    const game = this.serverService.games.find((element) => element.client === usr);
    if (!game) return;
    if (game) {
      game.host.gameData.status = 'idle';
      this.serverService.updateStatus(game.host.id, 'online');
      game.host.socket.leave(game.room.name);
      game.client.gameData.status = 'idle';
      this.serverService.updateStatus(game.client.id, 'online');
      game.host.socket.emit('foreverAlone', game.client.name);
      this.serverService.games.splice(this.serverService.games.indexOf(game), 1);
    }
  }
  @SubscribeMessage('settingsInvitee')
  settingsInvitee(@ConnectedSocket() client: Socket) {
    const usr = this.serverService.SocketToPlayer(client);
    if (!usr || usr.gameData.status != 'invited') return;
    usr.gameData.status = 'inCustomLobby';
    this.serverService.updateStatus(usr.id, 'inCustomLobby');
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
    const usr = this.serverService.SocketToPlayer(client);
    if (!usr && usr.gameData.status != 'inCustomLobby') return;
    const game = this.serverService.games.find((element) => element.client === usr);
    if (!game) return;
    if (game.room.options.powers) usr.gameData.power = new IPower(power);
    usr.gameData.status = 'ready';
    if (game.host.gameData.status === 'ready') {
      this.launchCustomGame(game);
    }
  }

  async launchCustomGame(game: Game) {
    this.serverService.initGameValues(game);
    if (game.room.options.powers) {
      this.serverService.initPower(game.client, game.gameState, game.gameState.clientBar, game.gameState.hostBar);
      this.serverService.initPower(game.host, game.gameState, game.gameState.hostBar, game.gameState.clientBar);
    }
    game.room.status = 'playing';
    game.room.hostName = game.host.name;
    game.room.clientName = game.client.name;
    game.host.gameData.status = 'playing';
    game.client.gameData.status = 'playing';
    this.serverService.updateStatus(game.host.id, 'inGame');
    this.serverService.updateStatus(game.client.id, 'inGame');
    game.room.opponent = instanceToPlain(await this.userService.getUserByNickname(game.client.name));
    game.room.host = instanceToPlain(await this.userService.getUserByNickname(game.host.name));
    game.room.start = new Date();
    game.host.socket.emit('startGame', game.room);
    game.client.socket.emit('startGame', game.room);
    this.gameLoop(game);
  }

  //Private conv version Lolo
  @SubscribeMessage('deliverMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody('message') messageToDeliver: string,
    @MessageBody('friendNickname') friendNickname: string,
  ) {
    if (!messageToDeliver || !friendNickname || messageToDeliver.length > 2000) return;
    let requester: UserEntity;
    const getAuthor = this.serverService.SocketToPlayer(client);
    if (!getAuthor) return;
    const receiver = this.serverService.userList.find((element) => element.name === friendNickname);
    if (receiver) {
      requester = await this.userService.getUserByNickname(receiver.name).catch(() => {
        return null;
      });
    } else {
      requester = await this.userService.getUserByNickname(friendNickname).catch(() => {
        return null;
      });
    }

    const author: UserEntity = await this.userService.getUserByNickname(getAuthor.name).catch(() => {
      return null;
    });
    if (!author || !requester) return;

    const conv = await this.privateMessageService.getConv(author.id, requester.id).catch(async () => {
      return await this.privateMessageService.createConv(author.id, requester.id);
    });
    if (await this.friendshipService.getBlockedStatus(requester.id, author.id)) {
      return { blocked: true, message: 'You are blocked by the user' };
    }
    await this.privateMessageService.updateLastMessageDate(conv);
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
  async sendChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody('channelId') channelId: number,
    @MessageBody('channelName') channelName: string,
    @MessageBody('content') content: string,
  ) {
    if (channelId && channelName && content && content.length <= 2000)
      return await this.serverService.sendChannelMessage(channelId, channelName, content, client.handshake.auth.user.id);
  }

  @SubscribeMessage('friendToConv')
  async friendToConv(@ConnectedSocket() client: Socket, @MessageBody('target') nickname: string) {
    if (nickname) {
      await this.userService
        .getUserByNickname(nickname)
        .then(async (user) => {
          if (user) {
            const friendship = await this.friendshipService.findFriendship(client.handshake.auth.user.id, user.id);
            const target = this.serverService.PlayerToSocket(user.nickname);
            if (target && friendship && friendship.status === 'friend') {
              this.server.to(target.id).emit('friendTooConv', client.handshake.auth.user.id);
            }
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('convRandom')
  async convRandom(@ConnectedSocket() client: Socket, @MessageBody('target') nickname: string, @MessageBody('created') created: boolean) {
    if (nickname && created) {
      await this.userService
        .getUserByNickname(nickname)
        .then(async (user) => {
          if (user) {
            const friendship = await this.friendshipService.findFriendship(client.handshake.auth.user.id, user.id);
            const target = this.serverService.PlayerToSocket(user.nickname);
            if (target)
              if ((friendship && friendship.status === 'invitation') || !friendship) {
                this.server.to(target.id).emit('newConv', client.handshake.auth.user.id);
              }
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('updateChannelMembers')
  async updateChannelMembers(@ConnectedSocket() client: Socket, @MessageBody('id') channelId: number) {
    if (channelId) {
      await this.serverService.updateChannelMembers(channelId, client);
    }
  }

  @SubscribeMessage('joinChannelRoom')
  async joinChannelRoom(@ConnectedSocket() client: Socket, @MessageBody('id') channelId: number) {
    if (channelId) {
      await this.serverService.joinChannelRoom(client, channelId);
    }
  }

  @SubscribeMessage('leaveChannelRoom')
  async leaveChannelRoom(@ConnectedSocket() client: Socket, @MessageBody('id') channelId: number) {
    if (channelId) {
      await this.serverService.leaveChannelRoom(client, channelId);
    }
  }

  @SubscribeMessage('channelUpdated')
  async channelUpdated(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('name') name: string, @MessageBody('type') type: string) {
    if (id && name && type) {
      await this.serverService.updateChannel(client, id, name, type);
    }
  }

  @SubscribeMessage('privateChannelInvite')
  async privateChannelInvite(@ConnectedSocket() client: Socket, @MessageBody('nickname') nickname: string, @MessageBody('channel') channel: string) {
    if (nickname && channel) {
      await this.userService
        .getUserByNickname(nickname)
        .then(async (user) => {
          if (user) {
            const socket = this.serverService.PlayerToSocket(user.nickname);
            const member = await ChannelMemberEntity.findOneBy({ channel: { name: channel }, user: { id: client.handshake.auth.user.id } });
            const target = await ChannelMemberEntity.findOneBy({ channel: { name: channel }, user: { nickname: nickname } });
            if (socket && member && !target) {
              console.log('privateChannelInvite');
              this.server.to(socket.id).emit('incomingChannelInvitation', channel);
            }
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('friendship-invite')
  async friendshipInvite(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('addresseeId') addresseeId: number) {
    if (id && addresseeId && id === client.handshake.auth.user.id && id !== addresseeId) {
      const friendship = await this.friendshipService.findFriendship(id, addresseeId);
      await this.userService
        .getUserById(addresseeId)
        .then(async (user) => {
          if (user) {
            const socket = this.serverService.PlayerToSocket(user.nickname);
            await this.userService
              .getUserById(id)
              .then((requester) => {
                if (socket && friendship && friendship.status === 'invitation' && friendship.addresseeId === addresseeId && requester) {
                  this.server.to(socket.id).emit('friendshipInvite', requester.nickname);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('block')
  async block(@ConnectedSocket() client: Socket, @MessageBody('blocked') blocked: string) {
    if (blocked) {
      await this.userService
        .getUserByNickname(blocked)
        .then(async (user) => {
          if (user) {
            if (await this.friendshipService.getBlockedStatus(client.handshake.auth.user.id, user.id)) {
              await this.userService
                .getUserById(client.handshake.auth.user.id)
                .then((cli) => {
                  const socket = this.serverService.PlayerToSocket(user.nickname);
                  if (socket && cli) {
                    this.server.to(socket.id).emit('blocked', cli.id, cli.nickname);
                  }
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('befriend')
  async befriend(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('addresseeId') addresseeId: number) {
    if (id && addresseeId && id === client.handshake.auth.user.id && id !== addresseeId) {
      const friendship = await this.friendshipService.findFriendship(id, addresseeId);
      await this.userService
        .getUserById(addresseeId)
        .then(async (user) => {
          if (user) {
            const socket = this.serverService.PlayerToSocket(user.nickname);
            await this.userService
              .getUserById(id)
              .then((requester) => {
                if (socket && friendship && friendship.status === 'friend' && requester) {
                  this.server.to(socket.id).emit('acceptInvite', requester.nickname);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('unfriend')
  async unfriend(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('addresseeId') addresseeId: number) {
    if (id && addresseeId && id === client.handshake.auth.user.id && id !== addresseeId) {
      const friendship = await this.friendshipService.findFriendship(id, addresseeId);
      await this.userService
        .getUserById(addresseeId)
        .then(async (user) => {
          if (user) {
            const socket = this.serverService.PlayerToSocket(user.nickname);
            await this.userService
              .getUserById(id)
              .then((requester) => {
                if (socket && !friendship && requester) {
                  this.server.to(socket.id).emit('removeFriend', requester.nickname);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  @SubscribeMessage('memberGotBanned')
  async memberGotBanned(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('nickname') nickname: string) {
    if (id && nickname) {
      const targetSocket = this.serverService.PlayerToSocket(nickname);
      if (targetSocket) {
        await this.chatService
          .getChannelById(id)
          .then(async (chan) => {
            const member = await ChannelMemberEntity.findOneBy({ channel: { id: chan.id }, user: { nickname: nickname } });
            const admin: ChannelMemberEntity = await ChannelMemberEntity.findOneBy({ channel: { id: chan.id }, user: { id: client.handshake.auth.user.id } });
            if (member && admin && admin.role !== ChannelRole.MEMBER) {
              targetSocket.leave(`${id}`);
              this.server.to(targetSocket.id).emit('gotBannedFromChannel', chan.name);
            }
          })
          .catch(() => {});
      }
    }
  }

  @SubscribeMessage('memberGotUnbanned')
  async memberGotUnbanned(@ConnectedSocket() client: Socket, @MessageBody('id') id: number, @MessageBody('nickname') nickname: string) {
    if (id && nickname) {
      const targetSocket = this.serverService.PlayerToSocket(nickname);
      if (targetSocket) {
        await this.chatService
          .getChannelById(id)
          .then(async (chan) => {
            const member = await ChannelMemberEntity.findOneBy({ channel: { id: chan.id }, user: { nickname: nickname } });
            const admin: ChannelMemberEntity = await ChannelMemberEntity.findOneBy({ channel: { id: chan.id }, user: { id: client.handshake.auth.user.id } });
            if (member && admin && admin.role !== ChannelRole.MEMBER) {
              targetSocket.join(`${id}`);
              this.server.to(targetSocket.id).emit('gotUnbannedFromChannel', chan.name);
            }
          })
          .catch(() => {});
      }
    }
  }
}
