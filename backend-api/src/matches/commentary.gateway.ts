import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
  } from '@nestjs/websockets';
  import { OnApplicationBootstrap } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';
  import { Commentary } from './schemas/commentary.schema';
  import { Match } from './schemas/match.schema';
  import { RedisService } from '../../redis.service';
  
  @WebSocketGateway({
    cors: {
      origin: 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })
  export class CommentaryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap  {
    @WebSocketServer()
    server: Server;
  
    private connectedClients = new Map<string, Socket>();
  
    constructor(private readonly redisService: RedisService) {}

    onApplicationBootstrap() {
        console.log('Application Bootstrap - subscribing to Redis events');
      
        this.redisService.subscribeToUpdates('commentary_updates', (data) => {
          this.server.to(`match_${data.matchId}`).emit('newCommentary', data);
        });
      
        this.redisService.subscribeToUpdates('match_updates', (data) => {
          this.server.emit('matchStarted', data);
        });
      }
      
      afterInit(server: Server) {
        console.log('Socket.IO Gateway initialized');
      }
      
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
      this.connectedClients.set(client.id, client);
      
      this.sendActiveMatches(client);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
      this.connectedClients.delete(client.id);
    }
  
    @SubscribeMessage('joinMatch')
    async handleJoinMatch(
      @MessageBody() data: { matchId: number },
      @ConnectedSocket() client: Socket,
    ) {
      const room = `match_${data.matchId}`;
      client.join(room);
      console.log(`Client ${client.id} joined match ${data.matchId}`);
      
      const recentCommentary = await this.redisService.getLiveCommentary(data.matchId, 10);
      client.emit('recentCommentary', { 
        matchId: data.matchId, 
        commentary: recentCommentary 
      });
      
      client.emit('joinedMatch', { 
        matchId: data.matchId, 
        message: 'Successfully joined match updates',
        clientsInRoom: this.getMatchRoomSize(data.matchId)
      });
    }
  
    @SubscribeMessage('leaveMatch')
    handleLeaveMatch(
      @MessageBody() data: { matchId: number },
      @ConnectedSocket() client: Socket,
    ) {
      const room = `match_${data.matchId}`;
      client.leave(room);
      console.log(`Client ${client.id} left match ${data.matchId}`);
    }
  
    async broadcastCommentary(matchId: number, commentary: Commentary) {
      const data = {
        matchId,
        commentary,
        timestamp: new Date(),
      };
  
      await this.redisService.addLiveCommentary(matchId, commentary);
      
      await this.redisService.publishUpdate('commentary_updates', data);
      
      const room = `match_${matchId}`;
      this.server.to(room).emit('newCommentary', data);
      
      console.log(`Broadcasting commentary for match ${matchId} to ${this.getMatchRoomSize(matchId)} clients`);
    }
  
    async broadcastMatchStarted(match: Match) {
      const data = {
        match,
        timestamp: new Date(),
      };
  
      await this.redisService.cacheMatch(match.matchId, match);
      await this.redisService.addActiveMatch(match.matchId);
      
      await this.redisService.publishUpdate('match_updates', data);
      
      this.server.emit('matchStarted', data);
      
      console.log(`Broadcasting new match started: ${match.matchId}`);
    }
  
    private async sendActiveMatches(client: Socket) {
      const activeMatches = await this.redisService.getActiveMatches();
      client.emit('activeMatches', { matches: activeMatches });
    }

    getConnectedClientsCount(): number {
      return this.connectedClients.size;
    }
  
    getMatchRoomSize(matchId: number): number {
      const room = this.server.sockets.adapter.rooms.get(`match_${matchId}`);
      return room ? room.size : 0;
    }
  
    @SubscribeMessage('getMatchStats')
    async handleGetMatchStats(@ConnectedSocket() client: Socket) {
      const stats = {
        totalConnectedClients: this.getConnectedClientsCount(),
        activeMatches: await this.redisService.getActiveMatches(),
      };
      client.emit('matchStats', stats);
    }
  }