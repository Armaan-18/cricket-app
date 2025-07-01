import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  public subscriber: Redis;
  private publisher: Redis;

  async onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    });

    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    });

    this.publisher = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    });

    console.log('Redis connected successfully');
  }

  
  subscribeToUpdates(channel: string, callback: (data: any) => void): void {
    this.subscriber.subscribe(channel, (err, count) => {
      if (err) {
        console.error(`Failed to subscribe to ${channel}:`, err);
      } else {
        console.log(`Subscribed to ${channel} (${count} total channels)`);
      }
    });
  
    this.subscriber.on('message', (chan, message) => {
      if (chan === channel) {
        const data = JSON.parse(message);
        callback(data);
      }
    });
  }
  
  async onModuleDestroy() {
    await this.redis.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  // Cache match data
  async cacheMatch(matchId: number, matchData: any): Promise<void> {
    await this.redis.setex(`match:${matchId}`, 3600, JSON.stringify(matchData));
  }

  // Get cached match
  async getCachedMatch(matchId: number): Promise<any> {
    const data = await this.redis.get(`match:${matchId}`);
    return data ? JSON.parse(data) : null;
  }

  // Store live commentary for quick access
  async addLiveCommentary(matchId: number, commentary: any): Promise<void> {
    await this.redis.lpush(`live:${matchId}`, JSON.stringify(commentary));
    await this.redis.ltrim(`live:${matchId}`, 0, 50); // Keep last 50 entries
  }

  // Get recent live commentary
  async getLiveCommentary(matchId: number, count: number = 10): Promise<any[]> {
    const data = await this.redis.lrange(`live:${matchId}`, 0, count - 1);
    return data.map(item => JSON.parse(item));
  }

  // Publish real-time updates
  async publishUpdate(channel: string, data: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(data));
  }


  // Store active matches
  async addActiveMatch(matchId: number): Promise<void> {
    await this.redis.sadd('active_matches', matchId.toString());
  }

  // Get active matches
  async getActiveMatches(): Promise<number[]> {
    const matches = await this.redis.smembers('active_matches');
    return matches.map(id => parseInt(id));
  }

  // Remove active match
  async removeActiveMatch(matchId: number): Promise<void> {
    await this.redis.srem('active_matches', matchId.toString());
  }
  
}